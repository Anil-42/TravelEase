-- Migration: V3__create_bookings_table.sql
-- Description: Create bookings table with relational integrity, status defaults, and financial protection

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    travel_start_date DATE NOT NULL,
    travelers INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) 
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) 
        REFERENCES packages (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_bookings_travelers CHECK (travelers > 0),
    CONSTRAINT chk_bookings_price CHECK (total_price >= 0.00),
    CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT chk_bookings_payment CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_package_id ON bookings (package_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_booking_date ON bookings (booking_date);
