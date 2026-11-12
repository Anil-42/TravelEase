package com.travelease.dto.response;

import java.util.List;

public class AdminCustomerDetailResponse {
    private AdminCustomerResponse customer;
    private List<BookingResponse> bookings;

    public AdminCustomerDetailResponse() {
    }

    public AdminCustomerDetailResponse(AdminCustomerResponse customer, List<BookingResponse> bookings) {
        this.customer = customer;
        this.bookings = bookings;
    }

    public AdminCustomerResponse getCustomer() {
        return customer;
    }

    public void setCustomer(AdminCustomerResponse customer) {
        this.customer = customer;
    }

    public List<BookingResponse> getBookings() {
        return bookings;
    }

    public void setBookings(List<BookingResponse> bookings) {
        this.bookings = bookings;
    }
}
