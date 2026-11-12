package com.travelease.dto.response;

import com.travelease.entity.InquiryStatus;

import java.time.LocalDateTime;

public class ContactInquiryResponse {
    private Long id;
    private String name;
    private String email;
    private String subject;
    private String message;
    private InquiryStatus status;
    private LocalDateTime submittedAt;

    public ContactInquiryResponse() {
    }

    public ContactInquiryResponse(Long id, String name, String email, String message, InquiryStatus status, LocalDateTime submittedAt) {
        this(id, name, email, "General Inquiry", message, status, submittedAt);
    }

    public ContactInquiryResponse(Long id, String name, String email, String subject, String message, InquiryStatus status, LocalDateTime submittedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.subject = subject;
        this.message = message;
        this.status = status;
        this.submittedAt = submittedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public void setStatus(InquiryStatus status) {
        this.status = status;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
