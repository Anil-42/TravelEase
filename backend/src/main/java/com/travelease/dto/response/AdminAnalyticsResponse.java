package com.travelease.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class AdminAnalyticsResponse {

    private List<StatusBreakdown> statusDistribution;
    private List<MonthlyTrend> bookingsOverTime;
    private List<PackagePopularity> popularPackages;

    public AdminAnalyticsResponse() {
    }

    public AdminAnalyticsResponse(List<StatusBreakdown> statusDistribution,
                                  List<MonthlyTrend> bookingsOverTime,
                                  List<PackagePopularity> popularPackages) {
        this.statusDistribution = statusDistribution;
        this.bookingsOverTime = bookingsOverTime;
        this.popularPackages = popularPackages;
    }

    public List<StatusBreakdown> getStatusDistribution() {
        return statusDistribution;
    }

    public void setStatusDistribution(List<StatusBreakdown> statusDistribution) {
        this.statusDistribution = statusDistribution;
    }

    public List<MonthlyTrend> getBookingsOverTime() {
        return bookingsOverTime;
    }

    public void setBookingsOverTime(List<MonthlyTrend> bookingsOverTime) {
        this.bookingsOverTime = bookingsOverTime;
    }

    public List<PackagePopularity> getPopularPackages() {
        return popularPackages;
    }

    public void setPopularPackages(List<PackagePopularity> popularPackages) {
        this.popularPackages = popularPackages;
    }

    public record StatusBreakdown(String status, long count, BigDecimal totalValue) {
    }

    public record MonthlyTrend(String period, long bookingCount, BigDecimal confirmedRevenue) {
    }

    public record PackagePopularity(Long packageId, String title, String destination, long bookingCount, BigDecimal confirmedRevenue) {
    }
}
