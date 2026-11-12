package com.travelease.dto.response;

import java.math.BigDecimal;

public class AdminStatsResponse {
    private long totalCustomers;
    private long activeCustomers;
    private long totalPackages;
    private long availablePackages;
    private long totalBookings;
    private long pendingBookings;
    private long confirmedBookings;
    private long completedBookings;
    private long cancelledBookings;
    /**
     * Confirmed revenue equals SUM(total_price) for CONFIRMED and COMPLETED bookings only.
     * PENDING and CANCELLED bookings are explicitly excluded from realized booking value.
     */
    private BigDecimal confirmedRevenue;
    private BigDecimal pendingBookingValue;
    private String revenueDefinition = "Sum of total_price for CONFIRMED and COMPLETED bookings (excludes PENDING and CANCELLED)";
    private long totalEnquiries;
    private long newEnquiries;

    public AdminStatsResponse() {
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getActiveCustomers() {
        return activeCustomers;
    }

    public void setActiveCustomers(long activeCustomers) {
        this.activeCustomers = activeCustomers;
    }

    public long getTotalPackages() {
        return totalPackages;
    }

    public void setTotalPackages(long totalPackages) {
        this.totalPackages = totalPackages;
    }

    public long getAvailablePackages() {
        return availablePackages;
    }

    public void setAvailablePackages(long availablePackages) {
        this.availablePackages = availablePackages;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getPendingBookings() {
        return pendingBookings;
    }

    public void setPendingBookings(long pendingBookings) {
        this.pendingBookings = pendingBookings;
    }

    public long getConfirmedBookings() {
        return confirmedBookings;
    }

    public void setConfirmedBookings(long confirmedBookings) {
        this.confirmedBookings = confirmedBookings;
    }

    public long getCompletedBookings() {
        return completedBookings;
    }

    public void setCompletedBookings(long completedBookings) {
        this.completedBookings = completedBookings;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public BigDecimal getConfirmedRevenue() {
        return confirmedRevenue;
    }

    public void setConfirmedRevenue(BigDecimal confirmedRevenue) {
        this.confirmedRevenue = confirmedRevenue;
    }

    public BigDecimal getPendingBookingValue() {
        return pendingBookingValue;
    }

    public void setPendingBookingValue(BigDecimal pendingBookingValue) {
        this.pendingBookingValue = pendingBookingValue;
    }

    public String getRevenueDefinition() {
        return revenueDefinition;
    }

    public void setRevenueDefinition(String revenueDefinition) {
        this.revenueDefinition = revenueDefinition;
    }

    public long getTotalEnquiries() {
        return totalEnquiries;
    }

    public void setTotalEnquiries(long totalEnquiries) {
        this.totalEnquiries = totalEnquiries;
    }

    public long getNewEnquiries() {
        return newEnquiries;
    }

    public void setNewEnquiries(long newEnquiries) {
        this.newEnquiries = newEnquiries;
    }
}
