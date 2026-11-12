-- Migration: V8__security_scalability_and_schema_updates.sql
-- Description: Add must_change_password security flag, package destination, inquiry subject, and composite scalability indexes

ALTER TABLE users
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER active;

CREATE INDEX idx_users_active_created ON users (active, created_at);
CREATE INDEX idx_users_role ON users (role);

ALTER TABLE packages
    ADD COLUMN destination VARCHAR(120) NULL AFTER title;

UPDATE packages SET destination = 'Goa' WHERE slug = 'goa-beach-escape' AND destination IS NULL;
UPDATE packages SET destination = 'Manali, Himachal Pradesh' WHERE slug = 'manali-mountain-getaway' AND destination IS NULL;
UPDATE packages SET destination = 'Jaipur, Rajasthan' WHERE slug = 'jaipur-royal-heritage-tour' AND destination IS NULL;
UPDATE packages SET destination = 'Munnar & Alleppey, Kerala' WHERE slug = 'kerala-backwater-bliss' AND destination IS NULL;

CREATE INDEX idx_packages_available_price ON packages (available, base_price);
CREATE INDEX idx_packages_destination ON packages (destination);

CREATE INDEX idx_bookings_status_date ON bookings (status, booking_date);
CREATE INDEX idx_bookings_user_date ON bookings (user_id, booking_date);
CREATE INDEX idx_bookings_travel_start_date ON bookings (travel_start_date);

ALTER TABLE contact_inquiries
    ADD COLUMN subject VARCHAR(200) NOT NULL DEFAULT 'General Inquiry' AFTER email;
