package com.travelease.service;

import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.response.ContactInquiryResponse;
import com.travelease.dto.response.PagedResponse;
import com.travelease.entity.ContactInquiry;
import com.travelease.entity.InquiryStatus;
import com.travelease.exception.ResourceNotFoundException;
import com.travelease.repository.ContactInquiryRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactService {

    private final ContactInquiryRepository contactInquiryRepository;

    public ContactService(ContactInquiryRepository contactInquiryRepository) {
        this.contactInquiryRepository = contactInquiryRepository;
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public ContactInquiryResponse submitInquiry(ContactInquiryRequest request) {
        ContactInquiry inquiry = new ContactInquiry(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getSubject(),
                request.getMessage().trim()
        );

        ContactInquiry saved = contactInquiryRepository.save(inquiry);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactInquiryResponse> getAllInquiries() {
        return contactInquiryRepository.findAllByOrderBySubmittedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<ContactInquiryResponse> getFilteredInquiries(InquiryStatus status, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<ContactInquiryResponse> page = contactInquiryRepository
                .findFilteredInquiries(status, cleanSearch, pageable)
                .map(this::mapToResponse);
        return new PagedResponse<>(page);
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public ContactInquiryResponse updateInquiryStatus(Long id, InquiryStatus status) {
        ContactInquiry inquiry = contactInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inquiry not found with id: " + id));
        inquiry.setStatus(status);
        return mapToResponse(contactInquiryRepository.save(inquiry));
    }

    private ContactInquiryResponse mapToResponse(ContactInquiry inquiry) {
        return new ContactInquiryResponse(
                inquiry.getId(),
                inquiry.getName(),
                inquiry.getEmail(),
                inquiry.getSubject(),
                inquiry.getMessage(),
                inquiry.getStatus(),
                inquiry.getSubmittedAt()
        );
    }
}
