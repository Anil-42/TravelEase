package com.travelease.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class BookingCreateRequest {

    @NotNull(message = "Package ID is required")
    private Long packageId;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer email is required")
    @Email(message = "Valid customer email is required")
    private String customerEmail;

    @NotNull(message = "Travel start date is required")
    @FutureOrPresent(message = "Travel start date cannot be in the past")
    private LocalDate travelStartDate;

    @NotNull(message = "Number of travelers is required")
    @Min(value = 1, message = "There must be at least 1 traveler")
    private Integer travelers;

    public BookingCreateRequest() {
    }

    public BookingCreateRequest(Long packageId, String customerName, String customerEmail,
                                LocalDate travelStartDate, Integer travelers) {
        this.packageId = packageId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.travelStartDate = travelStartDate;
        this.travelers = travelers;
    }

    public Long getPackageId() {
        return packageId;
    }

    public void setPackageId(Long packageId) {
        this.packageId = packageId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public LocalDate getTravelStartDate() {
        return travelStartDate;
    }

    public void setTravelStartDate(LocalDate travelStartDate) {
        this.travelStartDate = travelStartDate;
    }

    public Integer getTravelers() {
        return travelers;
    }

    public void setTravelers(Integer travelers) {
        this.travelers = travelers;
    }
}
