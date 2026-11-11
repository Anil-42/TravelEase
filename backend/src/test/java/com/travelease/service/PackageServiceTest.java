package com.travelease.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.dto.response.PackageResponse;
import com.travelease.entity.Package;
import com.travelease.exception.ResourceNotFoundException;
import com.travelease.repository.BookingRepository;
import com.travelease.repository.PackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PackageServiceTest {

    @Mock
    private PackageRepository packageRepository;

    @Mock
    private BookingRepository bookingRepository;

    private PackageService packageService;
    private Package goaPackage;

    @BeforeEach
    void setUp() {
        packageService = new PackageService(packageRepository, bookingRepository, new ObjectMapper());

        goaPackage = new Package(
                "goa-beach-escape",
                "Goa Beach Escape",
                "Golden beaches and fun",
                new BigDecimal("9999.00"),
                "4 Days / 3 Nights",
                "tour1.jpg",
                "goa.jpg",
                "[{\"day\":1,\"title\":\"Arrival\"}]",
                "[\"Breakfast\",\"Hotel\"]",
                true
        );
        goaPackage.setId(1L);
    }

    @Test
    void getAllAvailablePackages_ReturnsList() {
        when(packageRepository.findByAvailableTrue()).thenReturn(List.of(goaPackage));

        List<PackageResponse> list = packageService.getAllAvailablePackages();

        assertEquals(1, list.size());
        assertEquals("Goa Beach Escape", list.get(0).getTitle());
        assertEquals(new BigDecimal("9999.00"), list.get(0).getBasePrice());
    }

    @Test
    void getPackageById_Success() {
        when(packageRepository.findById(1L)).thenReturn(Optional.of(goaPackage));

        PackageResponse resp = packageService.getPackageById(1L);

        assertNotNull(resp);
        assertEquals(1L, resp.getId());
        assertEquals("goa-beach-escape", resp.getSlug());
    }

    @Test
    void getPackageById_NotFound_ThrowsException() {
        when(packageRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> packageService.getPackageById(999L));
    }
}
