package com.travelease.service;

import com.travelease.dto.request.BookingCreateRequest;
import com.travelease.dto.request.BookingStatusUpdateRequest;
import com.travelease.dto.response.BookingResponse;
import com.travelease.dto.response.PagedResponse;
import com.travelease.entity.*;
import com.travelease.entity.Package;
import com.travelease.exception.BadRequestException;
import com.travelease.exception.ResourceNotFoundException;
import com.travelease.exception.UnauthorizedException;
import com.travelease.repository.BookingRepository;
import com.travelease.repository.PackageRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PackageRepository packageRepository;

    public BookingService(BookingRepository bookingRepository, PackageRepository packageRepository) {
        this.bookingRepository = bookingRepository;
        this.packageRepository = packageRepository;
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public BookingResponse createBooking(BookingCreateRequest request, User currentUser) {
        Package pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Tour package not found with id: " + request.getPackageId()));

        if (!pkg.isAvailable()) {
            throw new BadRequestException("The package '" + pkg.getTitle() + "' is currently unavailable for new bookings.");
        }

        if (request.getTravelStartDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Travel start date cannot be in the past.");
        }

        if (request.getTravelers() == null || request.getTravelers() < 1) {
            throw new BadRequestException("Travelers count must be at least 1.");
        }

        // CRITICAL SECURITY ENFORCEMENT:
        // Always compute total price on the server: basePrice * travelers
        // Never accept or trust any client-supplied total price.
        BigDecimal calculatedTotalPrice = pkg.getBasePrice().multiply(BigDecimal.valueOf(request.getTravelers()));

        Booking booking = new Booking(
                currentUser,
                pkg,
                request.getCustomerName().trim(),
                request.getCustomerEmail().trim().toLowerCase(),
                request.getTravelStartDate(),
                request.getTravelers(),
                calculatedTotalPrice
        );

        // Required default statuses
        booking.setStatus(BookingStatus.PENDING);
        booking.setPaymentStatus(PaymentStatus.PENDING);

        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(User currentUser) {
        return bookingRepository.findByUserIdOrderByBookingDateDesc(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookingsForAdmin() {
        return bookingRepository.findAllByOrderByBookingDateDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> getFilteredBookingsForAdmin(BookingStatus status,
                                                                      Long packageId,
                                                                      LocalDate fromDate,
                                                                      LocalDate toDate,
                                                                      String search,
                                                                      Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Long bookingIdSearch = null;
        if (cleanSearch != null && cleanSearch.matches("\\d+")) {
            try {
                bookingIdSearch = Long.parseLong(cleanSearch);
            } catch (NumberFormatException ignored) {
            }
        }
        Page<BookingResponse> page = bookingRepository
                .findFilteredBookings(status, packageId, fromDate, toDate, cleanSearch, bookingIdSearch, pageable)
                .map(this::mapToResponse);
        return new PagedResponse<>(page);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id, User currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("You are not authorized to view this booking.");
        }

        return mapToResponse(booking);
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public BookingResponse cancelBooking(Long id, User currentUser) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());

        if (!isAdmin && !isOwner) {
            throw new UnauthorizedException("You are not authorized to cancel this booking.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("This booking is already cancelled.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Completed bookings cannot be cancelled.");
        }

        if (!isAdmin && booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be cancelled by customers. Please contact support.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public BookingResponse updateBookingStatus(Long id, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        BookingStatus currentStatus = booking.getStatus();
        BookingStatus nextStatus = request.getStatus() != null ? request.getStatus() : currentStatus;

        if (request.getStatus() != null && request.getStatus() != currentStatus) {
            validateStatusTransition(currentStatus, request.getStatus());
            booking.setStatus(request.getStatus());
        }

        if (request.getPaymentStatus() != null) {
            if (nextStatus == BookingStatus.CANCELLED && request.getPaymentStatus() == PaymentStatus.PAID) {
                throw new BadRequestException("Cannot mark a cancelled booking as PAID.");
            }
            booking.setPaymentStatus(request.getPaymentStatus());
        }

        return mapToResponse(bookingRepository.save(booking));
    }

    private void validateStatusTransition(BookingStatus current, BookingStatus target) {
        if (current == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a cancelled booking.");
        }
        if (current == BookingStatus.COMPLETED) {
            throw new BadRequestException("Cannot change status of a completed booking.");
        }
        if (current == BookingStatus.PENDING && target == BookingStatus.COMPLETED) {
            throw new BadRequestException("A pending booking must be confirmed before it can be marked completed.");
        }
    }

    public BookingResponse mapToResponse(Booking b) {
        BookingResponse response = new BookingResponse();
        response.setId(b.getId());
        response.setUserId(b.getUser().getId());
        response.setUserEmail(b.getUser().getEmail());
        response.setPackageId(b.getTourPackage().getId());
        response.setPackageSlug(b.getTourPackage().getSlug());
        response.setPackageTitle(b.getTourPackage().getTitle());
        response.setPackageBasePrice(b.getTourPackage().getBasePrice());
        response.setCustomerName(b.getCustomerName());
        response.setCustomerEmail(b.getCustomerEmail());
        response.setTravelStartDate(b.getTravelStartDate());
        response.setTravelers(b.getTravelers());
        response.setTotalPrice(b.getTotalPrice());
        response.setStatus(b.getStatus());
        response.setPaymentStatus(b.getPaymentStatus());
        response.setBookingDate(b.getBookingDate());
        response.setUpdatedAt(b.getUpdatedAt());
        response.setRazorpayOrderId(b.getRazorpayOrderId());
        response.setConfirmationEmailSent(b.isConfirmationEmailSent());
        return response;
    }
}
