package com.travelease.dto.request;

import com.travelease.entity.BookingStatus;
import com.travelease.entity.PaymentStatus;

public class BookingStatusUpdateRequest {

    private BookingStatus status;
    private PaymentStatus paymentStatus;

    public BookingStatusUpdateRequest() {
    }

    public BookingStatusUpdateRequest(BookingStatus status, PaymentStatus paymentStatus) {
        this.status = status;
        this.paymentStatus = paymentStatus;
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
