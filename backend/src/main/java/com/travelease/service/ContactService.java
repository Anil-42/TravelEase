package com.travelease.service;

import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.response.ContactInquiryResponse;
import com.travelease.entity.ContactInquiry;
import com.travelease.repository.ContactInquiryRepository;
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
    public ContactInquiryResponse submitInquiry(ContactInquiryRequest request) {
        ContactInquiry inquiry = new ContactInquiry(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
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

    private ContactInquiryResponse mapToResponse(ContactInquiry inquiry) {
        return new ContactInquiryResponse(
                inquiry.getId(),
                inquiry.getName(),
                inquiry.getEmail(),
                inquiry.getMessage(),
                inquiry.getStatus(),
                inquiry.getSubmittedAt()
        );
    }
}
