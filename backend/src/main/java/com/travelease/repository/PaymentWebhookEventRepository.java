package com.travelease.repository;

import com.travelease.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {
    boolean existsByEventId(String eventId);
    Optional<PaymentWebhookEvent> findByEventId(String eventId);
}
