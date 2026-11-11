# TravelEase – Spring Boot 3 Backend API

This is the modernized backend API for the **TravelEase** platform, built with **Spring Boot 3.3.4**, **Java 17/21**, **Spring Security 6**, **Spring Data JPA**, **Flyway**, and **MySQL 8.0**.

---

## 1. Technology Stack
- **Framework:** Spring Boot 3.3.4
- **Language / Runtime:** Java 17+ (Java SE 26 verified)
- **Security:** Spring Security 6 + JJWT (HMAC-SHA256) + BCrypt
- **Persistence:** Spring Data JPA + Hibernate 6
- **Database Migrations:** Flyway 10.15 (Target Database: `travelease_flyway`)
- **Build Tool:** Maven (Maven Wrapper `mvnw.cmd` included)

---

## 2. Configuration & Environment Variables

All sensitive values are externalized and injected via environment variables:

| Variable | Description | Default Value |
|---|---|---|
| `DB_HOST` | MySQL hostname | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Active modernized database | `travelease_flyway` |
| `DB_USERNAME` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | (Configured securely) |
| `JWT_SECRET` | 256-bit secret key for JWT signing | (Secure 256-bit hex default for dev) |
| `JWT_EXPIRATION_MS` | Token expiration time in ms | `86400000` (24 hours) |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173` |
| `TRAVELEASE_ADMIN_USERNAME` | Bootstrapped admin username | (Optional runtime bootstrap) |
| `TRAVELEASE_ADMIN_EMAIL` | Bootstrapped admin email | (Optional runtime bootstrap) |
| `TRAVELEASE_ADMIN_PASSWORD` | Bootstrapped admin password | (Optional runtime bootstrap) |

---

## 3. Running the Backend

### Prerequisites
- JDK 17, 21, or newer.
- MySQL Server 8.0 running locally on port 3306 with `travelease_flyway` database created.

### Running with Maven Wrapper
```bash
# In D:\other\TravelEase\backend
set DB_NAME=travelease_flyway
set DB_USERNAME=root
set DB_PASSWORD=your_mysql_password

# Windows (Command Prompt)
mvnw.cmd spring-boot:run

# Windows (PowerShell)
.\mvnw.cmd spring-boot:run
```

### Running the Packaged Fat JAR
```bash
# Build
.\mvnw.cmd clean package

# Run
java -jar target/travelease-backend-1.0.0.jar
```

---

## 4. Admin Account Bootstrapping

No hardcoded admin credentials exist in migration files. To initialize the primary administrator, launch the backend with bootstrap environment variables:

```bash
set TRAVELEASE_ADMIN_USERNAME=admin
set TRAVELEASE_ADMIN_EMAIL=admin@travelease.com
set TRAVELEASE_ADMIN_PASSWORD=YourSecurePassword@123
java -jar target/travelease-backend-1.0.0.jar
```

The `AdminBootstrapper` executes during startup:
- Checks if any user with `ROLE_ADMIN` exists.
- If none exists, creates the admin user with BCrypt password hashing and logs the activation.
- On subsequent startups, bootstrapping is skipped automatically.

---

## 5. API Endpoint Documentation

### 5.1 Authentication (`/api/auth`)

#### `POST /api/auth/register`
Registers a new customer account. Public registration is locked strictly to `ROLE_USER`.
- **Request Body:**
  ```json
  {
    "username": "anil_traveler",
    "email": "anil@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 2,
    "username": "anil_traveler",
    "email": "anil@example.com",
    "role": "ROLE_USER"
  }
  ```

#### `POST /api/auth/login`
Authenticates user and returns JWT token. Rejects inactive or disabled accounts.
- **Request Body:**
  ```json
  {
    "email": "anil@example.com",
    "password": "securePassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 2,
    "username": "anil_traveler",
    "email": "anil@example.com",
    "role": "ROLE_USER"
  }
  ```

#### `GET /api/auth/me`
Returns current authenticated user details.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "id": 2,
    "username": "anil_traveler",
    "email": "anil@example.com",
    "role": "ROLE_USER",
    "active": true,
    "createdAt": "2026-11-11T08:46:40"
  }
  ```

---

### 5.2 Tour Packages (`/api/packages`)

#### `GET /api/packages`
Public endpoint returning all available packages with structured itineraries and inclusions.
- **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "slug": "goa-beach-escape",
      "title": "Goa Beach Escape",
      "description": "Golden beaches, vibrant nightlife, and endless coastal adventure await you.",
      "basePrice": 9999.00,
      "duration": "4 Days / 3 Nights",
      "coverImage": "tour1.jpg",
      "detailImage": "goa.jpg",
      "available": true,
      "itinerary": [
        { "day": 1, "title": "Arrival in Goa", "details": "Arrival at Goa Airport, beachside leisure at Baga." },
        { "day": 2, "title": "North Goa Sightseeing", "details": "North Goa sightseeing – Fort Aguada, Calangute, Anjuna Beach." },
        { "day": 3, "title": "South Goa Heritage & Cruise", "details": "South Goa – Miramar Beach, Basilica of Bom Jesus, Mandovi cruise." },
        { "day": 4, "title": "Departure", "details": "Local shopping and departure." }
      ],
      "inclusions": [
        "3 Nights in a 3-star hotel",
        "Daily breakfast",
        "Airport transfers",
        "Guided sightseeing"
      ]
    }
  ]
  ```

#### `GET /api/packages/{id}`
Public endpoint returning single package details.
- **Response (200 OK):** Package object.

#### `POST /api/packages` *(Admin Only)*
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "slug": "shimla-winter-wonderland",
    "title": "Shimla Winter Wonderland",
    "description": "Colonial charm and snow peaks.",
    "basePrice": 8999.00,
    "duration": "3 Days / 2 Nights",
    "coverImage": "shimla.jpg",
    "detailImage": "shimla_detail.jpg",
    "available": true,
    "itinerary": [...],
    "inclusions": [...]
  }
  ```
- **Response (201 Created):** Created package object.

#### `PUT /api/packages/{id}` *(Admin Only)*
Updates package details.

#### `DELETE /api/packages/{id}` *(Admin Only)*
Deletes package. If bookings exist, rejects with `400 Bad Request` to preserve relational integrity.

#### `PATCH /api/packages/{id}/availability?available=false` *(Admin Only)*
Toggles package visibility without deleting records.

---

### 5.3 Bookings (`/api/bookings`)

#### `POST /api/bookings` *(Authenticated)*
Creates a new booking. **Server calculates total price (`basePrice × travelers`). Client price is never trusted.**
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "packageId": 1,
    "customerName": "Anil Kumar",
    "customerEmail": "anil@example.com",
    "travelStartDate": "2026-12-15",
    "travelers": 2
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "userId": 2,
    "userEmail": "anil@example.com",
    "packageId": 1,
    "packageSlug": "goa-beach-escape",
    "packageTitle": "Goa Beach Escape",
    "packageBasePrice": 9999.00,
    "customerName": "Anil Kumar",
    "customerEmail": "anil@example.com",
    "travelStartDate": "2026-12-15",
    "travelers": 2,
    "totalPrice": 19998.00,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "bookingDate": "2026-11-11T08:46:42"
  }
  ```

#### `GET /api/bookings/my` *(Authenticated)*
Returns bookings belonging exclusively to the authenticated user.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Array of user's `BookingResponse` objects.

#### `GET /api/bookings/{id}` *(Authenticated)*
Returns single booking. Users can only view their own; administrators can view any booking.

#### `PATCH /api/bookings/{id}/cancel` *(Authenticated)*
Cancels booking. Customers can cancel only if status is `PENDING`. Administrators can cancel any booking.

#### `GET /api/bookings` *(Admin Only)*
Returns all bookings across all customers.

#### `PATCH /api/bookings/{id}/status` *(Admin Only)*
Updates booking status (`CONFIRMED`, `CANCELLED`, `COMPLETED`) and payment status (`PAID`, `REFUNDED`).

---

### 5.4 Contact Inquiries (`/api/contact`)

#### `POST /api/contact` *(Public)*
Submits customer inquiry.
- **Request Body:**
  ```json
  {
    "name": "Rahul Mehta",
    "email": "rahul@example.com",
    "message": "Do you offer corporate discounts for large team trips?"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": 1,
    "name": "Rahul Mehta",
    "email": "rahul@example.com",
    "message": "Do you offer corporate discounts for large team trips?",
    "status": "NEW",
    "submittedAt": "2026-11-11T08:46:42"
  }
  ```

#### `GET /api/contact` *(Admin Only)*
Returns list of all inquiries ordered by latest first.

---

## 6. Testing

Run the full automated test suite:
```bash
.\mvnw.cmd test
```

Test coverage includes:
- **`AuthServiceTest`**: Registration, duplicate rejection, role lock, valid login, bad password, inactive account rejection.
- **`PackageServiceTest`**: Package retrieval, single package lookup, not found error.
- **`BookingServiceTest`**: Server-side pricing enforcement (`travelers * basePrice`), status defaults (`PENDING`), unavailable package rejection, past date rejection, ownership access authorization, customer cancellation rules.
- **`ContactServiceTest`**: Inbound inquiry submission.
- **`ApiControllerTest`**: End-to-end HTTP integration tests for Auth, Packages, Bookings, Security, and Inquiries via MockMvc.
