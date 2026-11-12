package com.travelease.controller;

import com.travelease.dto.request.PackageCreateRequest;
import com.travelease.dto.request.PackageUpdateRequest;
import com.travelease.dto.response.PackageResponse;
import com.travelease.dto.response.PagedResponse;
import com.travelease.service.PackageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class PackageController {

    private final PackageService packageService;

    public PackageController(PackageService packageService) {
        this.packageService = packageService;
    }

    @GetMapping
    public ResponseEntity<List<PackageResponse>> getAllAvailablePackages() {
        return ResponseEntity.ok(packageService.getAllAvailablePackages());
    }

    @GetMapping("/paged")
    public ResponseEntity<PagedResponse<PackageResponse>> searchPackagesPaged(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        String safeSort = ("basePrice".equals(sortBy) || "title".equals(sortBy) || "createdAt".equals(sortBy)) ? sortBy : "id";
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(dir, safeSort));
        return ResponseEntity.ok(packageService.searchAvailablePackages(search, destination, maxPrice, pageable));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PackageResponse>> getAllPackagesForAdmin() {
        return ResponseEntity.ok(packageService.getAllPackagesForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PackageResponse> getPackageById(@PathVariable Long id) {
        return ResponseEntity.ok(packageService.getPackageById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PackageResponse> createPackage(@Valid @RequestBody PackageCreateRequest request) {
        PackageResponse response = packageService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PackageResponse> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody PackageUpdateRequest request
    ) {
        PackageResponse response = packageService.updatePackage(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePackage(@PathVariable Long id) {
        packageService.deletePackage(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PackageResponse> setAvailability(
            @PathVariable Long id,
            @RequestParam boolean available
    ) {
        return ResponseEntity.ok(packageService.setAvailability(id, available));
    }
}
