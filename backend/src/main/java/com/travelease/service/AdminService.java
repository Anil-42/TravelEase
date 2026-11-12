package com.travelease.service;

import com.travelease.dto.request.BookingStatusUpdateRequest;
import com.travelease.dto.request.CustomerStatusUpdateRequest;
import com.travelease.dto.request.InquiryStatusUpdateRequest;
import com.travelease.dto.response.*;
import com.travelease.entity.*;
import com.travelease.exception.BadRequestException;
import com.travelease.exception.ResourceNotFoundException;
import com.travelease.repository.BookingRepository;
import com.travelease.repository.ContactInquiryRepository;
import com.travelease.repository.PackageRepository;
import com.travelease.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PackageRepository packageRepository;
    private final BookingRepository bookingRepository;
    private final ContactInquiryRepository contactInquiryRepository;
    private final BookingService bookingService;
    private final ContactService contactService;

    public AdminService(UserRepository userRepository,
                        PackageRepository packageRepository,
                        BookingRepository bookingRepository,
                        ContactInquiryRepository contactInquiryRepository,
                        BookingService bookingService,
                        ContactService contactService) {
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
        this.bookingRepository = bookingRepository;
        this.contactInquiryRepository = contactInquiryRepository;
        this.bookingService = bookingService;
        this.contactService = contactService;
    }

    @Transactional(readOnly = true)
    @Cacheable("admin_dashboard_stats")
    public AdminStatsResponse getOverviewStats() {
        AdminStatsResponse stats = new AdminStatsResponse();
        stats.setTotalCustomers(userRepository.countByRole(Role.ROLE_USER));
        stats.setActiveCustomers(userRepository.countByRoleAndActiveTrue(Role.ROLE_USER));
        stats.setTotalPackages(packageRepository.count());
        stats.setAvailablePackages(packageRepository.countByAvailableTrue());

        long pending = bookingRepository.countByStatus(BookingStatus.PENDING);
        long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long completed = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        stats.setPendingBookings(pending);
        stats.setConfirmedBookings(confirmed);
        stats.setCompletedBookings(completed);
        stats.setCancelledBookings(cancelled);
        stats.setTotalBookings(pending + confirmed + completed + cancelled);

        BigDecimal confirmedRevenue = bookingRepository.sumConfirmedAndCompletedRevenue();
        BigDecimal pendingValue = bookingRepository.sumPendingBookingValue();
        stats.setConfirmedRevenue(confirmedRevenue != null ? confirmedRevenue : BigDecimal.ZERO);
        stats.setPendingBookingValue(pendingValue != null ? pendingValue : BigDecimal.ZERO);

        stats.setTotalEnquiries(contactInquiryRepository.count());
        stats.setNewEnquiries(contactInquiryRepository.countByStatus(InquiryStatus.NEW));

        return stats;
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAnalytics() {
        List<AdminAnalyticsResponse.StatusBreakdown> statusDistribution = new ArrayList<>();
        for (Object[] row : bookingRepository.countAndSumGroupedByStatus()) {
            BookingStatus status = (BookingStatus) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal sum = (BigDecimal) row[2];
            statusDistribution.add(new AdminAnalyticsResponse.StatusBreakdown(status.name(), count, sum));
        }

        List<AdminAnalyticsResponse.MonthlyTrend> bookingsOverTime = new ArrayList<>();
        for (Object[] row : bookingRepository.findMonthlyBookingTrends()) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            BigDecimal revenue = (BigDecimal) row[3];
            String period = String.format("%04d-%02d", year, month);
            bookingsOverTime.add(new AdminAnalyticsResponse.MonthlyTrend(period, count, revenue));
        }

        List<AdminAnalyticsResponse.PackagePopularity> popularPackages = new ArrayList<>();
        for (Object[] row : bookingRepository.findTopPackagesByBookings(PageRequest.of(0, 10))) {
            Long pkgId = ((Number) row[0]).longValue();
            String title = (String) row[1];
            String destination = (String) row[2];
            long count = ((Number) row[3]).longValue();
            BigDecimal revenue = (BigDecimal) row[4];
            popularPackages.add(new AdminAnalyticsResponse.PackagePopularity(pkgId, title, destination, count, revenue));
        }

        return new AdminAnalyticsResponse(statusDistribution, bookingsOverTime, popularPackages);
    }

    @Transactional(readOnly = true)
    public PagedResponse<BookingResponse> getBookings(BookingStatus status,
                                                      Long packageId,
                                                      LocalDate fromDate,
                                                      LocalDate toDate,
                                                      String search,
                                                      Pageable pageable) {
        return bookingService.getFilteredBookingsForAdmin(status, packageId, fromDate, toDate, search, pageable);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Long id, BookingStatusUpdateRequest request) {
        return bookingService.updateBookingStatus(id, request);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminCustomerResponse> getCustomers(Boolean active, String search, Pageable pageable) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<AdminCustomerResponse> page = userRepository.findCustomerSummaries(active, cleanSearch, pageable);
        return new PagedResponse<>(page);
    }

    @Transactional(readOnly = true)
    public AdminCustomerDetailResponse getCustomerDetail(Long customerId) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        if (user.getRole() != Role.ROLE_USER) {
            throw new BadRequestException("Requested user is not a customer account.");
        }

        long bookingCount = bookingRepository.countByUserId(user.getId());
        AdminCustomerResponse summary = new AdminCustomerResponse(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                bookingCount
        );
        List<BookingResponse> bookings = bookingService.getMyBookings(user);
        return new AdminCustomerDetailResponse(summary, bookings);
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public AdminCustomerResponse updateCustomerStatus(Long customerId, CustomerStatusUpdateRequest request, User actingAdmin) {
        if (actingAdmin != null && actingAdmin.getId().equals(customerId)) {
            throw new BadRequestException("Administrators cannot deactivate their own account.");
        }

        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + customerId));

        if (user.getRole() != Role.ROLE_USER) {
            throw new BadRequestException("Only customer accounts can be activated or deactivated from customer management.");
        }

        user.setActive(request.getActive());
        User saved = userRepository.save(user);
        long bookingCount = bookingRepository.countByUserId(saved.getId());

        return new AdminCustomerResponse(
                saved.getId(),
                saved.getDisplayName(),
                saved.getEmail(),
                saved.getRole(),
                saved.isActive(),
                saved.getCreatedAt(),
                bookingCount
        );
    }

    @Transactional(readOnly = true)
    public PagedResponse<ContactInquiryResponse> getEnquiries(InquiryStatus status, String search, Pageable pageable) {
        return contactService.getFilteredInquiries(status, search, pageable);
    }

    @Transactional
    public ContactInquiryResponse updateEnquiryStatus(Long id, InquiryStatusUpdateRequest request) {
        return contactService.updateInquiryStatus(id, request.getStatus());
    }
}
