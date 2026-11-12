package com.travelease.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.config.JwtService;
import com.travelease.dto.request.BookingCreateRequest;
import com.travelease.dto.request.ChangePasswordRequest;
import com.travelease.dto.request.ContactInquiryRequest;
import com.travelease.dto.request.LoginRequest;
import com.travelease.dto.request.RegisterRequest;
import com.travelease.dto.request.ResetPasswordRequest;
import com.travelease.entity.Package;
import com.travelease.entity.PasswordResetToken;
import com.travelease.entity.Role;
import com.travelease.entity.User;
import com.travelease.repository.PackageRepository;
import com.travelease.repository.PasswordResetTokenRepository;
import com.travelease.repository.UserRepository;
import com.travelease.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiControllerTest {

    private static final String STRONG_TEST_PASSWORD = "Horizon#Trip2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PackageRepository packageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

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
            samplePackage.setDestination("Goa");
            samplePackage = packageRepository.save(samplePackage);
        } else {
            samplePackage = packageRepository.findBySlug("test-goa-tour").get();
        }
    }

    @Test
    void auth_RegisterAndLogin_Flow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest("testuser", "testflow@example.com", STRONG_TEST_PASSWORD, STRONG_TEST_PASSWORD);

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

        // 3. Login with valid credentials
        LoginRequest loginReq = new LoginRequest("testflow@example.com", STRONG_TEST_PASSWORD);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ROLE_USER"));

        // 4. Login with invalid credentials returns 401 (never 500)
        LoginRequest badLogin = new LoginRequest("testflow@example.com", "WrongPass#9999!");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void auth_WeakPasswordOnRegister_RejectedWith400() throws Exception {
        RegisterRequest weakReq = new RegisterRequest("weakuser", "weak@example.com", "123456", "123456");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void packages_GetPublicPackages_Success() throws Exception {
        mockMvc.perform(get("/api/packages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/packages/paged"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
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
        String token = registerAndGetToken("booker", "booker@example.com");

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
        req.setSubject("Group Tour Quote");

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sneha"))
                .andExpect(jsonPath("$.subject").value("Group Tour Quote"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void adminEndpoints_NormalUserCannotAccess_ReturnsForbidden() throws Exception {
        String userToken = registerAndGetToken("normaluser1", "normal1@example.com");

        mockMvc.perform(post("/api/packages")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hacked Tour\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/contact")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void admin_MustChangePassword_BlocksDashboardUntilUpdated() throws Exception {
        User tempAdmin = userRepository.findByEmail("tempadmin@travelease.com").orElseGet(() -> {
            User a = new User("tempadmin", "tempadmin@travelease.com", passwordEncoder.encode("TempAdmin1!"), Role.ROLE_ADMIN);
            a.setMustChangePassword(true);
            return userRepository.save(a);
        });

        String token = jwtService.generateToken(tempAdmin);

        // Blocked from admin dashboard while mustChangePassword=true
        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Password Change Required"));

        // Allowed to inspect /api/auth/me
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));

        // Change password to strong password
        ChangePasswordRequest changeReq = new ChangePasswordRequest("TempAdmin1!", "NewAdmin#Strong2026!", "NewAdmin#Strong2026!");
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk());

        // Re-login after password change
        LoginRequest relogin = new LoginRequest("tempadmin@travelease.com", "NewAdmin#Strong2026!");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(relogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andReturn();

        String freshToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // Now admin endpoints succeed
        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPackages").isNumber());

        mockMvc.perform(get("/api/admin/dashboard/analytics")
                        .header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusDistribution").isArray());
    }

    @Test
    void user_CannotReadOrCancelAnotherUsersBooking_ReturnsUnauthorized() throws Exception {
        String userAToken = registerAndGetToken("userA", "userA@example.com");
        String userBToken = registerAndGetToken("userB", "userB@example.com");

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

        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("You are not authorized to view this booking."));

        mockMvc.perform(patch("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("You are not authorized to cancel this booking."));
    }

    @Test
    void admin_DashboardStatsCache_EvictedOnlyOnSuccessfulRegistration() throws Exception {
        String adminToken = getOrCreateAdminToken();

        Cache statsCache = cacheManager.getCache("admin_dashboard_stats");
        assertNotNull(statsCache);
        statsCache.clear();

        MvcResult initialStatsRes = mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        long initialCustomers = objectMapper.readTree(initialStatsRes.getResponse().getContentAsString())
                .get("totalCustomers").asLong();
        assertNotNull(statsCache.get(SimpleKey.EMPTY));

        // Failed registration must NOT evict cached dashboard statistics
        RegisterRequest invalidReg = new RegisterRequest("baduser", "badcache@example.com", "weak", "weak");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReg)))
                .andExpect(status().isBadRequest());
        assertNotNull(statsCache.get(SimpleKey.EMPTY));

        // Successful registration evicts admin_dashboard_stats so customer count updates
        RegisterRequest validReg = new RegisterRequest("cacheevict", "cacheevict@example.com", STRONG_TEST_PASSWORD, STRONG_TEST_PASSWORD);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReg)))
                .andExpect(status().isCreated());
        assertNull(statsCache.get(SimpleKey.EMPTY));

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCustomers").value(initialCustomers + 1));
    }

    @Test
    void adminBookingStatus_EmptyUpdateRejectedWith400_AndValidTransitionsEnforced() throws Exception {
        String customerToken = registerAndGetToken("statususer", "statususer@example.com");
        String adminToken = getOrCreateAdminToken();

        long booking1Id = createBookingAndReturnId(customerToken, LocalDate.now().plusDays(15));
        long booking2Id = createBookingAndReturnId(customerToken, LocalDate.now().plusDays(25));

        // Empty payload {} rejected with HTTP 400 on both status endpoints
        mockMvc.perform(patch("/api/admin/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));

        mockMvc.perform(patch("/api/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"));

        // Invalid jump PENDING -> COMPLETED rejected
        mockMvc.perform(patch("/api/admin/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isBadRequest());

        // Valid transition PENDING -> CONFIRMED + PAID succeeds
        mockMvc.perform(patch("/api/admin/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\",\"paymentStatus\":\"PAID\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));

        // Valid transition CONFIRMED -> COMPLETED succeeds
        mockMvc.perform(patch("/api/admin/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Terminal state COMPLETED -> CANCELLED rejected
        mockMvc.perform(patch("/api/admin/bookings/" + booking1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CANCELLED\"}"))
                .andExpect(status().isBadRequest());

        // CANCELLED + PAID rejected; PENDING -> CANCELLED succeeds and becomes terminal
        mockMvc.perform(patch("/api/admin/bookings/" + booking2Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CANCELLED\",\"paymentStatus\":\"PAID\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/admin/bookings/" + booking2Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CANCELLED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        mockMvc.perform(patch("/api/admin/bookings/" + booking2Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void passwordPolicy_ConsistentAcrossRegisterChangeResetForcedAdmin_AndPreservesExistingLogin() throws Exception {
        // 1. Existing user with legacy password hash still logs in normally
        User legacyUser = userRepository.findByEmail("legacy@example.com").orElseGet(() ->
                userRepository.save(new User("legacyuser", "legacy@example.com", passwordEncoder.encode("legacy1"), Role.ROLE_USER))
        );
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("legacy@example.com", "legacy1"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
        assertNotEquals("legacy1", legacyUser.getPassword());

        // 2. Bypassed frontend invalid passwords are rejected with 400 on registration
        String[] invalidPasswords = {
                "travel@123",
                "TRAVEL@123",
                "Travelpass",
                "Travel123",
                "Travel@",
                "A1@" + "a".repeat(126),
                " Travel@123",
                "Travel@123 "
        };
        for (int i = 0; i < invalidPasswords.length; i++) {
            RegisterRequest invalidReq = new RegisterRequest("invuser" + i, "inv" + i + "@example.com",
                    invalidPasswords[i], invalidPasswords[i]);
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidReq)))
                    .andExpect(status().isBadRequest());
        }

        // 3. Valid 8-char password (including low distinct-character count) succeeds on registration with BCrypt
        RegisterRequest validReg = new RegisterRequest("policyuser", "policy@example.com", "Travel@12", "Travel@12");
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReg)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        String userToken = objectMapper.readTree(regRes.getResponse().getContentAsString()).get("token").asText();

        User savedPolicyUser = userRepository.findByEmail("policy@example.com").orElseThrow();
        assertTrue(savedPolicyUser.getPassword().startsWith("$2"));
        assertTrue(passwordEncoder.matches("Travel@12", savedPolicyUser.getPassword()));

        // 4. Authenticated password change rejects invalid, accepts HelloWorld#2026, updates passwordChangedAt
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest("Travel@12", "TRAVEL@123", "TRAVEL@123"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest("Travel@12", "HelloWorld#2026", "HelloWorld#2026"))))
                .andExpect(status().isOk());

        User afterChange = userRepository.findByEmail("policy@example.com").orElseThrow();
        assertNotNull(afterChange.getPasswordChangedAt());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("policy@example.com", "Travel@12"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("policy@example.com", "HelloWorld#2026"))))
                .andExpect(status().isOk());

        // 5. Password reset rejects invalid password, accepts MyPass!789, consumes token
        String rawToken = "simplified-policy-reset-token-0123456789abcdef";
        PasswordResetToken resetToken = passwordResetTokenRepository.save(
                new PasswordResetToken(afterChange, AuthService.hashToken(rawToken), LocalDateTime.now().plusMinutes(15))
        );

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(rawToken, "Travelpass", "Travelpass"))))
                .andExpect(status().isBadRequest());

        assertFalse(passwordResetTokenRepository.findById(resetToken.getId()).orElseThrow().isUsed());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ResetPasswordRequest(rawToken, "MyPass!789", "MyPass!789"))))
                .andExpect(status().isOk());

        assertTrue(passwordResetTokenRepository.findById(resetToken.getId()).orElseThrow().isUsed());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("policy@example.com", "MyPass!789"))))
                .andExpect(status().isOk());

        // 6. Forced admin password change rejects invalid simplified password, accepts Travel@123
        User forcedAdmin = userRepository.findByEmail("forcedpolicyadmin@travelease.com").orElseGet(() -> {
            User a = new User("forcedpolicyadmin", "forcedpolicyadmin@travelease.com", passwordEncoder.encode("Temp#Pass1"), Role.ROLE_ADMIN);
            a.setMustChangePassword(true);
            return userRepository.save(a);
        });
        String tempAdminToken = jwtService.generateToken(forcedAdmin);

        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + tempAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest("Temp#Pass1", "Travel@", "Travel@"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + tempAdminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + tempAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ChangePasswordRequest("Temp#Pass1", "Travel@123", "Travel@123"))))
                .andExpect(status().isOk());

        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("forcedpolicyadmin@travelease.com", "Travel@123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false))
                .andReturn();
        String newAdminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/admin/dashboard/stats")
                        .header("Authorization", "Bearer " + newAdminToken))
                .andExpect(status().isOk());
    }

    private String getOrCreateAdminToken() {
        User admin = userRepository.findByEmail("auditadmin@travelease.com").orElseGet(() -> {
            User u = new User("auditadmin", "auditadmin@travelease.com", passwordEncoder.encode(STRONG_TEST_PASSWORD), Role.ROLE_ADMIN);
            u.setActive(true);
            u.setMustChangePassword(false);
            return userRepository.save(u);
        });
        return jwtService.generateToken(admin);
    }

    private long createBookingAndReturnId(String token, LocalDate travelDate) throws Exception {
        BookingCreateRequest req = new BookingCreateRequest(
                samplePackage.getId(),
                "Status Tester",
                "statususer@example.com",
                travelDate,
                1
        );
        MvcResult result = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private String registerAndGetToken(String username, String email) throws Exception {
        RegisterRequest reg = new RegisterRequest(username, email, STRONG_TEST_PASSWORD, STRONG_TEST_PASSWORD);
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        return jsonNode.get("token").asText();
    }
}
