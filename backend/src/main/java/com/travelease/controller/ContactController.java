package com.travelease.controller;

import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.request.InquiryStatusUpdateRequest;
import com.travelease.dto.response.ContactInquiryResponse;
import com.travelease.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<ContactInquiryResponse> submitInquiry(
            @Valid @RequestBody ContactInquiryRequest request
    ) {
        ContactInquiryResponse response = contactService.submitInquiry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ContactInquiryResponse>> getAllInquiries() {
        return ResponseEntity.ok(contactService.getAllInquiries());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContactInquiryResponse> updateInquiryStatus(
            @PathVariable Long id,
            @Valid @RequestBody InquiryStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(contactService.updateInquiryStatus(id, request.getStatus()));
    }
}
