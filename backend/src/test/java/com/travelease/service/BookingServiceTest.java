package com.travelease.service;

import com.travelease.dto.request.BookingCreateRequest;
import com.travelease.dto.response.BookingResponse;
import com.travelease.entity.*;
import com.travelease.entity.Package;
import com.travelease.exception.BadRequestException;
import com.travelease.exception.UnauthorizedException;
import com.travelease.repository.BookingRepository;
import com.travelease.repository.PackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PackageRepository packageRepository;

    @InjectMocks
    private BookingService bookingService;

    private User customer;
    private User otherCustomer;
    private User admin;
    private Package goaPackage;
    private Package unavailablePackage;

    @BeforeEach
    void setUp() {
        customer = new User("anil_traveler", "anil@example.com", "pass", Role.ROLE_USER);
        customer.setId(10L);

        otherCustomer = new User("other_traveler", "other@example.com", "pass", Role.ROLE_USER);
        otherCustomer.setId(20L);

        admin = new User("admin_user", "admin@travelease.com", "pass", Role.ROLE_ADMIN);
        admin.setId(1L);

        goaPackage = new Package(
                "goa-beach-escape",
                "Goa Beach Escape",
                "Goa package",
                new BigDecimal("9999.00"),
                "4 Days / 3 Nights",
                "tour1.jpg",
                "goa.jpg",
                "[]",
                "[]",
                true
        );
        goaPackage.setId(1L);

        unavailablePackage = new Package(
                "sold-out-tour",
                "Sold Out Tour",
                "Unavailable package",
                new BigDecimal("5000.00"),
                "2 Days",
                null,
                null,
                "[]",
                "[]",
                false // UNAVAILABLE
        );
        unavailablePackage.setId(2L);
    }

    @Test
    void createBooking_CalculatesPriceOnServer_AndDefaultsToPending() {
        BookingCreateRequest req = new BookingCreateRequest(
                1L,
                "Anil Kumar",
                "anil@example.com",
                LocalDate.now().plusDays(10),
                3 // 3 travelers * 9999.00 = 29997.00
        );

        when(packageRepository.findById(1L)).thenReturn(Optional.of(goaPackage));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(101L);
            return b;
        });

        BookingResponse resp = bookingService.createBooking(req, customer);

        assertNotNull(resp);
        // Verify server-side pricing: 3 * 9999 = 29997.00
        assertEquals(new BigDecimal("29997.00"), resp.getTotalPrice());
        // Verify status defaults: PENDING
        assertEquals(BookingStatus.PENDING, resp.getStatus());
        assertEquals(PaymentStatus.PENDING, resp.getPaymentStatus());
        assertEquals(10L, resp.getUserId());
        assertEquals("Goa Beach Escape", resp.getPackageTitle());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void createBooking_UnavailablePackage_ThrowsBadRequest() {
        BookingCreateRequest req = new BookingCreateRequest(
                2L,
                "Anil Kumar",
                "anil@example.com",
                LocalDate.now().plusDays(5),
                2
        );

        when(packageRepository.findById(2L)).thenReturn(Optional.of(unavailablePackage));

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(req, customer));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBooking_PastTravelDate_ThrowsBadRequest() {
        BookingCreateRequest req = new BookingCreateRequest(
                1L,
                "Anil Kumar",
                "anil@example.com",
                LocalDate.now().minusDays(1), // PAST DATE
                2
        );

        when(packageRepository.findById(1L)).thenReturn(Optional.of(goaPackage));

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(req, customer));
    }

    @Test
    void getBookingById_Owner_CanAccess() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

        BookingResponse resp = bookingService.getBookingById(50L, customer);
        assertNotNull(resp);
        assertEquals(50L, resp.getId());
    }

    @Test
    void getBookingById_OtherUser_ThrowsUnauthorized() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

        // otherCustomer attempts to access customer's booking
        assertThrows(UnauthorizedException.class, () -> bookingService.getBookingById(50L, otherCustomer));
    }

    @Test
    void getBookingById_Admin_CanAccessAnyBooking() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

        // Admin accesses customer's booking
        BookingResponse resp = bookingService.getBookingById(50L, admin);
        assertNotNull(resp);
        assertEquals(50L, resp.getId());
    }

    @Test
    void cancelBooking_OwnerPending_Success() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse resp = bookingService.cancelBooking(50L, customer);
        assertEquals(BookingStatus.CANCELLED, resp.getStatus());
    }

    @Test
    void cancelBooking_OwnerConfirmed_ThrowsBadRequest() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);
        booking.setStatus(BookingStatus.CONFIRMED);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

        assertThrows(BadRequestException.class, () -> bookingService.cancelBooking(50L, customer));
    }

    @Test
    void cancelBooking_OtherUser_ThrowsUnauthorized() {
        Booking booking = new Booking(customer, goaPackage, "Anil", "anil@example.com", LocalDate.now().plusDays(5), 1, new BigDecimal("9999.00"));
        booking.setId(50L);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(50L)).thenReturn(Optional.of(booking));

        // otherCustomer attempts to cancel customer's booking
        assertThrows(UnauthorizedException.class, () -> bookingService.cancelBooking(50L, otherCustomer));
        verify(bookingRepository, never()).save(any(Booking.class));
    }
}
