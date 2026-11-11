-- Migration: V6__create_payments_and_webhook_events.sql
-- Description: Add payment tracking, order association, confirmation email flag, and webhook idempotency tables

ALTER TABLE bookings ADD COLUMN razorpay_order_id VARCHAR(100) NULL AFTER payment_status;
CREATE INDEX idx_bookings_razorpay_order ON bookings (razorpay_order_id);

ALTER TABLE bookings ADD COLUMN confirmation_email_sent BOOLEAN NOT NULL DEFAULT FALSE AFTER updated_at;

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    method VARCHAR(50) NULL,
    error_code VARCHAR(100) NULL,
    error_description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) 
        REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_payments_order UNIQUE (razorpay_order_id),
    CONSTRAINT uq_payments_payment UNIQUE (razorpay_payment_id),
    CONSTRAINT chk_payments_status CHECK (status IN ('CREATED', 'SUCCESS', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_user_id ON payments (user_id);

CREATE TABLE payment_webhook_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NULL,
    payment_id VARCHAR(100) NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_webhook_event_id UNIQUE (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_webhook_order_id ON payment_webhook_events (order_id);
