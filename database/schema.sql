-- =====================================================================
-- TravelEase Database Schema & Seed Script (Consolidated Reference)
-- Database: MySQL 8.0+
-- Authoritative Migrations: backend/src/main/resources/db/migration/
-- =====================================================================

CREATE DATABASE IF NOT EXISTS travelease 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE travelease;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_active ON users (active);

-- 2. PACKAGES TABLE
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

-- 3. BOOKINGS TABLE
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

-- 4. CONTACT INQUIRIES TABLE
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

-- 5. INITIAL PACKAGE CATALOG SEEDING (The 4 Original TravelEase Packages)
INSERT INTO packages (slug, title, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
VALUES 
(
    'goa-beach-escape',
    'Goa Beach Escape',
    'Golden beaches, vibrant nightlife, and endless coastal adventure await you.',
    9999.00,
    '4 Days / 3 Nights',
    'tour1.jpg',
    'goa.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Goa", "details": "Arrival at Goa Airport, beachside leisure at Baga."},
        {"day": 2, "title": "North Goa Sightseeing", "details": "North Goa sightseeing – Fort Aguada, Calangute, Anjuna Beach."},
        {"day": 3, "title": "South Goa Heritage & Cruise", "details": "South Goa – Miramar Beach, Basilica of Bom Jesus, Mandovi cruise."},
        {"day": 4, "title": "Departure", "details": "Local shopping and departure."}
    ]' AS JSON),
    CAST('[
        "3 Nights in a 3-star hotel",
        "Daily breakfast",
        "Airport transfers",
        "Guided sightseeing"
    ]' AS JSON),
    TRUE
),
(
    'manali-mountain-getaway',
    'Manali Mountain Getaway',
    'Experience snow peaks, adventure sports, and serene mountain beauty.',
    9499.00,
    '4 Days / 3 Nights',
    'tour2.jpg',
    'manali.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Manali", "details": "Arrival at Manali and leisure evening at Mall Road."},
        {"day": 2, "title": "Solang Valley Adventures", "details": "Solang Valley snow adventures and paragliding."},
        {"day": 3, "title": "Old Manali & Hot Springs", "details": "Visit Hidimba Temple, Vashisht Hot Springs, and Old Manali."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights in mountain-view resort",
        "Daily breakfast and dinner",
        "Local sightseeing",
        "Cab transfers"
    ]' AS JSON),
    TRUE
),
(
    'jaipur-royal-heritage-tour',
    'Jaipur Royal Heritage Tour',
    'Explore royal palaces, colorful bazaars, and timeless Rajasthani heritage.',
    9999.00,
    '4 Days / 3 Nights',
    'tour3.jpg',
    'jaipur.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Jaipur", "details": "Arrival in Jaipur, visit Hawa Mahal and local markets."},
        {"day": 2, "title": "Forts & Palaces", "details": "Explore Amber Fort, City Palace, and Jantar Mantar."},
        {"day": 3, "title": "Nahargarh & Heritage Dining", "details": "Visit Nahargarh Fort, enjoy Rajasthani cuisine at Chokhi Dhani."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights accommodation in heritage hotel",
        "Daily breakfast",
        "Private cab transfers",
        "Local sightseeing and guide"
    ]' AS JSON),
    TRUE
),
(
    'kerala-backwater-bliss',
    'Kerala Backwater Bliss',
    'Relax in lush backwaters, tea gardens, and tropical tranquility.',
    10499.00,
    '4 Days / 3 Nights',
    'tour4.jpg',
    'kerala.jpg',
    CAST('[
        {"day": 1, "title": "Arrival at Kochi & Munnar", "details": "Arrival at Kochi, transfer to Munnar – visit waterfalls en route."},
        {"day": 2, "title": "Munnar Tea Plantations", "details": "Explore Munnar tea plantations and Eravikulam National Park."},
        {"day": 3, "title": "Alleppey Houseboat Stay", "details": "Travel to Alleppey – enjoy a houseboat cruise with meals."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights accommodation (Munnar + Alleppey)",
        "Daily breakfast and 1 houseboat stay",
        "Private cab transfers",
        "Local sightseeing"
    ]' AS JSON),
    TRUE
);

-- Note on Admin Account Creation:
-- Initial admin account is created securely at application startup via Spring Boot Bootstrapper
-- reading TRAVELEASE_ADMIN_USERNAME and TRAVELEASE_ADMIN_PASSWORD environment variables,
-- ensuring zero static credentials or hashes are checked into source control.
