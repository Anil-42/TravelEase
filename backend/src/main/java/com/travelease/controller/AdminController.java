package com.travelease.controller;

import com.travelease.dto.request.BookingStatusUpdateRequest;
import com.travelease.dto.request.CustomerStatusUpdateRequest;
import com.travelease.dto.request.InquiryStatusUpdateRequest;
import com.travelease.dto.response.*;
import com.travelease.entity.BookingStatus;
import com.travelease.entity.InquiryStatus;
import com.travelease.entity.User;
import com.travelease.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminStatsResponse> getOverviewStats() {
        return ResponseEntity.ok(adminService.getOverviewStats());
    }

    @GetMapping("/dashboard/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @GetMapping("/bookings")
    public ResponseEntity<PagedResponse<BookingResponse>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long packageId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "bookingDate"));
        return ResponseEntity.ok(adminService.getBookings(status, packageId, fromDate, toDate, search, pageable));
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateBookingStatus(id, request));
    }

    @GetMapping("/customers")
    public ResponseEntity<PagedResponse<AdminCustomerResponse>> getCustomers(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getCustomers(active, search, pageable));
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<AdminCustomerDetailResponse> getCustomerDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getCustomerDetail(id));
    }

    @PatchMapping("/customers/{id}/status")
    public ResponseEntity<AdminCustomerResponse> updateCustomerStatus(
            @PathVariable Long id,
            @Valid @RequestBody CustomerStatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(adminService.updateCustomerStatus(id, request, currentUser));
    }

    @GetMapping("/enquiries")
    public ResponseEntity<PagedResponse<ContactInquiryResponse>> getEnquiries(
            @RequestParam(required = false) InquiryStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "submittedAt"));
        return ResponseEntity.ok(adminService.getEnquiries(status, search, pageable));
    }

    @PatchMapping("/enquiries/{id}/status")
    public ResponseEntity<ContactInquiryResponse> updateEnquiryStatus(
            @PathVariable Long id,
            @Valid @RequestBody InquiryStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(adminService.updateEnquiryStatus(id, request));
    }
}
