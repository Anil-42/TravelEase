package com.travelease.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.travelease.entity.BookingStatus;
import com.travelease.entity.PaymentStatus;
import jakarta.validation.constraints.AssertTrue;

public class BookingStatusUpdateRequest {

    private BookingStatus status;
    private PaymentStatus paymentStatus;

    public BookingStatusUpdateRequest() {
    }

    public BookingStatusUpdateRequest(BookingStatus status, PaymentStatus paymentStatus) {
        this.status = status;
        this.paymentStatus = paymentStatus;
    }

    @JsonIgnore
    @AssertTrue(message = "At least one of 'status' or 'paymentStatus' must be provided.")
    public boolean isAtLeastOneStatusProvided() {
        return status != null || paymentStatus != null;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}
