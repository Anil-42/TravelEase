# TravelEase – Database Foundation (Phase 1)

This directory contains the database documentation, schema reference, and architectural plans for the **TravelEase** platform.

---

## 1. Database Target & Environments

- **Active Modernized Database:** `travelease_flyway` (managed exclusively by Flyway migrations V1–V5).
- **Legacy Unchanged Database:** `travelease` (preserved intact without any drops, truncates, or alterations).
- **Authoritative Migration Location:** [`backend/src/main/resources/db/migration/`](file:///D:/other/TravelEase/backend/src/main/resources/db/migration/)

---

## 2. Migration Manifest (`travelease_flyway`)

| Migration File | Description | Execution Status in `flyway_schema_history` |
|---|---|---|
| `V1__create_users_table.sql` | Users table with `active` column, unique email constraint, and role validation | **Success (Rank 1)** |
| `V2__create_packages_table.sql` | Tour package catalog with unique slug, JSON itinerary/inclusions, price checks | **Success (Rank 2)** |
| `V3__create_bookings_table.sql` | Bookings table with `ON DELETE RESTRICT`, defaults `status='PENDING'`, `payment_status='PENDING'` | **Success (Rank 3)** |
| `V4__create_contact_inquiries_table.sql` | Inquiries table with status workflow constraints | **Success (Rank 4)** |
| `V5__seed_initial_packages.sql` | Seeds the 4 authentic TravelEase packages with preserved prices, durations, and itineraries | **Success (Rank 5)** |

---

## 3. Spring Boot Application Configuration (`application.yml`)

The backend is configured to connect to `travelease_flyway`:

```yaml
server:
  port: 8080

spring:
  application:
    name: travelease-backend
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/travelease_flyway?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate # Schema is strictly managed by Flyway
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration
```

---

## 4. Key Architectural Decisions Implemented

1. **User Deletion Integrity (`ON DELETE RESTRICT`):**  
   `bookings.user_id` has `ON DELETE RESTRICT ON UPDATE CASCADE`. Booking and financial records cannot be cascade-deleted. User deactivation is handled through `users.active = FALSE`.
2. **Booking & Payment Status Defaults (`PENDING`):**  
   `bookings.status` and `bookings.payment_status` default to `'PENDING'`. No assumption of pre-confirmed bookings or real payment processing is made.
3. **Zero Hardcoded Admin/Test Credentials:**  
   `V5__seed_initial_packages.sql` seeds exclusively the 4 catalog packages. Admin creation is handled at runtime via environment variables (`TRAVELEASE_ADMIN_USERNAME` / `TRAVELEASE_ADMIN_PASSWORD`).
