package com.travelease.repository;

import com.travelease.entity.Booking;
import com.travelease.entity.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"user", "tourPackage"})
    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "tourPackage"})
    List<Booking> findAllByOrderByBookingDateDesc();

    boolean existsByTourPackageId(Long packageId);

    long countByUserId(Long userId);

    long countByStatus(BookingStatus status);

    @Query("""
            SELECT COALESCE(SUM(b.totalPrice), 0)
            FROM Booking b
            WHERE b.status IN (com.travelease.entity.BookingStatus.CONFIRMED, com.travelease.entity.BookingStatus.COMPLETED)
            """)
    BigDecimal sumConfirmedAndCompletedRevenue();

    @Query("""
            SELECT COALESCE(SUM(b.totalPrice), 0)
            FROM Booking b
            WHERE b.status = com.travelease.entity.BookingStatus.PENDING
            """)
    BigDecimal sumPendingBookingValue();

    @Query("""
            SELECT b.status, COUNT(b), COALESCE(SUM(b.totalPrice), 0)
            FROM Booking b
            GROUP BY b.status
            """)
    List<Object[]> countAndSumGroupedByStatus();

    @Query("""
            SELECT p.id, p.title, COALESCE(p.destination, p.title), COUNT(b),
                   COALESCE(SUM(CASE WHEN b.status IN (com.travelease.entity.BookingStatus.CONFIRMED, com.travelease.entity.BookingStatus.COMPLETED)
                                     THEN b.totalPrice ELSE 0 END), 0)
            FROM Booking b
            JOIN b.tourPackage p
            GROUP BY p.id, p.title, p.destination
            ORDER BY COUNT(b) DESC
            """)
    List<Object[]> findTopPackagesByBookings(Pageable pageable);

    @Query("""
            SELECT EXTRACT(YEAR FROM b.bookingDate), EXTRACT(MONTH FROM b.bookingDate), COUNT(b),
                   COALESCE(SUM(CASE WHEN b.status IN (com.travelease.entity.BookingStatus.CONFIRMED, com.travelease.entity.BookingStatus.COMPLETED)
                                     THEN b.totalPrice ELSE 0 END), 0)
            FROM Booking b
            GROUP BY EXTRACT(YEAR FROM b.bookingDate), EXTRACT(MONTH FROM b.bookingDate)
            ORDER BY EXTRACT(YEAR FROM b.bookingDate) ASC, EXTRACT(MONTH FROM b.bookingDate) ASC
            """)
    List<Object[]> findMonthlyBookingTrends();

    @EntityGraph(attributePaths = {"user", "tourPackage"})
    @Query("""
            SELECT b FROM Booking b
            WHERE (:status IS NULL OR b.status = :status)
              AND (:packageId IS NULL OR b.tourPackage.id = :packageId)
              AND (:fromDate IS NULL OR b.travelStartDate >= :fromDate)
              AND (:toDate IS NULL OR b.travelStartDate <= :toDate)
              AND (:search IS NULL
                   OR LOWER(b.customerName) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.customerEmail) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.tourPackage.title) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR (:bookingId IS NOT NULL AND b.id = :bookingId))
            """)
    Page<Booking> findFilteredBookings(
            @Param("status") BookingStatus status,
            @Param("packageId") Long packageId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            @Param("bookingId") Long bookingId,
            Pageable pageable
    );
}
