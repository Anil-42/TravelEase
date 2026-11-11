-- Migration: V2__create_packages_table.sql
-- Description: Create tour packages table with slug, pricing, images, and JSON itinerary/inclusions

CREATE TABLE IF NOT EXISTS packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    cover_image VARCHAR(255),
    detail_image VARCHAR(255),
    itinerary_json JSON NOT NULL,
    inclusions_json JSON NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_packages_slug UNIQUE (slug),
    CONSTRAINT chk_packages_price CHECK (base_price >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_packages_available ON packages (available);
CREATE INDEX idx_packages_base_price ON packages (base_price);
