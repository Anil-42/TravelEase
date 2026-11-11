package com.travelease.repository;

import com.travelease.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    List<Payment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
    Optional<Payment> findFirstByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
