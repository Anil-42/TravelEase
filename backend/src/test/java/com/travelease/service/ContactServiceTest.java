package com.travelease.service;

import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.response.ContactInquiryResponse;
import com.travelease.entity.ContactInquiry;
import com.travelease.entity.InquiryStatus;
import com.travelease.repository.ContactInquiryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock
    private ContactInquiryRepository contactInquiryRepository;

    @InjectMocks
    private ContactService contactService;

    @Test
    void submitInquiry_Success() {
        ContactInquiryRequest req = new ContactInquiryRequest("Rahul", "rahul@example.com", "Inquiry about tour options");

        when(contactInquiryRepository.save(any(ContactInquiry.class))).thenAnswer(invocation -> {
            ContactInquiry c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        ContactInquiryResponse resp = contactService.submitInquiry(req);

        assertNotNull(resp);
        assertEquals(1L, resp.getId());
        assertEquals("Rahul", resp.getName());
        assertEquals("rahul@example.com", resp.getEmail());
        assertEquals(InquiryStatus.NEW, resp.getStatus());
        verify(contactInquiryRepository).save(any(ContactInquiry.class));
    }
}
