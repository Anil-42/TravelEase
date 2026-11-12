package com.travelease.dto.request;

import com.travelease.entity.InquiryStatus;
import jakarta.validation.constraints.NotNull;

public class InquiryStatusUpdateRequest {

    @NotNull(message = "Inquiry status is required")
    private InquiryStatus status;

    public InquiryStatusUpdateRequest() {
    }

    public InquiryStatusUpdateRequest(InquiryStatus status) {
        this.status = status;
    }

    public InquiryStatus getStatus() {
        return status;
    }

    public void setStatus(InquiryStatus status) {
        this.status = status;
    }
}
