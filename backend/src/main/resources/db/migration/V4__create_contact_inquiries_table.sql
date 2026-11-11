-- Migration: V4__create_contact_inquiries_table.sql
-- Description: Create contact inquiries table to handle feedback and queries

CREATE TABLE IF NOT EXISTS contact_inquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contact_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_contact_email ON contact_inquiries (email);
CREATE INDEX idx_contact_status ON contact_inquiries (status);
CREATE INDEX idx_contact_submitted_at ON contact_inquiries (submitted_at);
