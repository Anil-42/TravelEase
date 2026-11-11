package com.travelease.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.dto.request.BookingCreateRequest;
import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.request.LoginRequest;
import com.travelease.dto.request.RegisterRequest;
import com.travelease.entity.Package;
import com.travelease.repository.PackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PackageRepository packageRepository;

    private Package samplePackage;

    @BeforeEach
    void setUp() {
        if (packageRepository.findBySlug("test-goa-tour").isEmpty()) {
            samplePackage = new Package(
                    "test-goa-tour",
                    "Test Goa Beach Escape",
                    "A test package for integration test",
                    new BigDecimal("9999.00"),
                    "4 Days / 3 Nights",
                    "tour1.jpg",
                    "goa.jpg",
                    "[{\"day\": 1, \"title\": \"Arrival\"}]",
                    "[\"Breakfast\"]",
                    true
            );
            samplePackage = packageRepository.save(samplePackage);
        } else {
            samplePackage = packageRepository.findBySlug("test-goa-tour").get();
        }
    }

    @Test
    void auth_RegisterAndLogin_Flow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("testuser", "testflow@example.com", "password123");

        // 1. Register
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("testflow@example.com"));

        // 2. Duplicate registration rejected
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));

        // 3. Login
        LoginRequest loginReq = new LoginRequest("testflow@example.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    void packages_GetPublicPackages_Success() throws Exception {
        mockMvc.perform(get("/api/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void bookings_Unauthenticated_Rejected() throws Exception {
        BookingCreateRequest bookingReq = new BookingCreateRequest(
                samplePackage.getId(),
                "Guest",
                "guest@example.com",
                LocalDate.now().plusDays(7),
                2
        );

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void bookings_AuthenticatedUser_CreatesBookingWithServerCalculatedPrice() throws Exception {
        // Register user and get JWT
        RegisterRequest reg = new RegisterRequest("booker", "booker@example.com", "pass12345");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = jsonNode.get("token").asText();

        // 2 travelers * 9999.00 = 19998.00
        BookingCreateRequest bookingReq = new BookingCreateRequest(
                samplePackage.getId(),
                "Booker Test",
                "booker@example.com",
                LocalDate.now().plusDays(14),
                2
        );

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalPrice").value(19998.00))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.packageTitle").value("Test Goa Beach Escape"));
    }

    @Test
    void contact_SubmitInquiry_Success() throws Exception {
        ContactInquiryRequest req = new ContactInquiryRequest(
                "Sneha",
                "sneha@example.com",
                "I would like to ask about package availability."
        );

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sneha"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void adminEndpoints_NormalUserCannotAccess_ReturnsForbidden() throws Exception {
        String userToken = registerAndGetToken("normaluser1", "normal1@example.com");

        // 1. Admin-only package creation rejected with 403 Forbidden
        mockMvc.perform(post("/api/packages")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hacked Tour\"}"))
                .andExpect(status().isForbidden());

        // 2. Admin-only all bookings listing rejected with 403 Forbidden
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // 3. Admin-only contact inquiries listing rejected with 403 Forbidden
        mockMvc.perform(get("/api/contact")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void user_CannotReadOrCancelAnotherUsersBooking_ReturnsUnauthorized() throws Exception {
        String userAToken = registerAndGetToken("userA", "userA@example.com");
        String userBToken = registerAndGetToken("userB", "userB@example.com");

        // User A creates a booking
        BookingCreateRequest bookingReq = new BookingCreateRequest(
                samplePackage.getId(),
                "User A",
                "userA@example.com",
                LocalDate.now().plusDays(20),
                2
        );

        MvcResult bookingResult = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode bookingNode = objectMapper.readTree(bookingResult.getResponse().getContentAsString());
        long bookingId = bookingNode.get("id").asLong();

        // User B attempts to read User A's booking -> 401 Unauthorized
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("You are not authorized to view this booking."));

        // User B attempts to cancel User A's booking -> 401 Unauthorized
        mockMvc.perform(patch("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("You are not authorized to cancel this booking."));
    }

    private String registerAndGetToken(String username, String email) throws Exception {
        RegisterRequest reg = new RegisterRequest(username, email, "pass12345");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        return jsonNode.get("token").asText();
    }
}
