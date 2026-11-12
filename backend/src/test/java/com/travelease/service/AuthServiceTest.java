package com.travelease.service;

import com.travelease.config.JwtService;
import com.travelease.dto.request.ChangePasswordRequest;
import com.travelease.dto.request.ForgotPasswordRequest;
import com.travelease.dto.request.LoginRequest;
import com.travelease.dto.request.RegisterRequest;
import com.travelease.dto.request.ResetPasswordRequest;
import com.travelease.dto.response.AuthResponse;
import com.travelease.dto.response.MessageResponse;
import com.travelease.entity.PasswordResetToken;
import com.travelease.entity.Role;
import com.travelease.entity.User;
import com.travelease.exception.BadRequestException;
import com.travelease.repository.PasswordResetTokenRepository;
import com.travelease.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    private static final String STRONG_PASS = "Horizon#Trip2026!";
    private static final String NEW_STRONG_PASS = "Summit#Valley2027!";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    private JwtService jwtService;
    private AuthService authService;
    private User activeUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        jwtService.setSecretKey("mock-jwt-secret-key-for-unit-testing-purposes-only-32-bytes-minimum");
        authService = new AuthService(userRepository, passwordResetTokenRepository, passwordEncoder, jwtService, emailService);

        activeUser = new User("anil_traveler", "anil@example.com", "encodedPassword", Role.ROLE_USER);
        activeUser.setId(10L);
        activeUser.setActive(true);
    }

    @Test
    void register_Success() {
        RegisterRequest req = new RegisterRequest("newuser", "new@example.com", STRONG_PASS, STRONG_PASS);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode(STRONG_PASS)).thenReturn("hashedSecret");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(20L);
            return u;
        });

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertEquals("new@example.com", resp.getEmail());
        assertEquals(Role.ROLE_USER.name(), resp.getRole());
        assertFalse(resp.isMustChangePassword());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_WeakPassword_ThrowsBadRequest() {
        RegisterRequest req = new RegisterRequest("newuser", "new@example.com", "weak123", "weak123");
        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_MismatchedConfirm_ThrowsBadRequest() {
        RegisterRequest req = new RegisterRequest("newuser", "new@example.com", STRONG_PASS, NEW_STRONG_PASS);
        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsBadRequest() {
        RegisterRequest req = new RegisterRequest("existing", "anil@example.com", STRONG_PASS, STRONG_PASS);
        when(userRepository.existsByEmail("anil@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_Success() {
        LoginRequest req = new LoginRequest("anil@example.com", "plainPass");
        when(userRepository.findByEmail("anil@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("plainPass", "encodedPassword")).thenReturn(true);

        AuthResponse resp = authService.login(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertEquals("anil@example.com", resp.getEmail());
    }

    @Test
    void login_WrongPassword_ThrowsBadCredentials() {
        LoginRequest req = new LoginRequest("anil@example.com", "wrongPass");
        when(userRepository.findByEmail("anil@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", "encodedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void login_InactiveAccount_ThrowsDisabledException() {
        activeUser.setActive(false);
        LoginRequest req = new LoginRequest("anil@example.com", "plainPass");
        when(userRepository.findByEmail("anil@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("plainPass", "encodedPassword")).thenReturn(true);

        assertThrows(DisabledException.class, () -> authService.login(req));
    }

    @Test
    void changePassword_Success_ClearsMustChangePassword() {
        activeUser.setMustChangePassword(true);
        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", NEW_STRONG_PASS, NEW_STRONG_PASS);
        when(passwordEncoder.matches("oldPass", "encodedPassword")).thenReturn(true);
        when(passwordEncoder.matches(NEW_STRONG_PASS, "encodedPassword")).thenReturn(false);
        when(passwordEncoder.encode(NEW_STRONG_PASS)).thenReturn("newEncodedPass");

        MessageResponse response = authService.changePassword(req, activeUser);

        assertNotNull(response);
        assertEquals("newEncodedPass", activeUser.getPassword());
        assertFalse(activeUser.isMustChangePassword());
        assertNotNull(activeUser.getPasswordChangedAt());
        verify(userRepository).save(activeUser);
    }

    @Test
    void changePassword_WeakNewPassword_ThrowsBadRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", "short", "short");
        assertThrows(BadRequestException.class, () -> authService.changePassword(req, activeUser));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_MismatchedConfirm_ThrowsBadRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", NEW_STRONG_PASS, "different");
        assertThrows(BadRequestException.class, () -> authService.changePassword(req, activeUser));
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_IncorrectCurrentPassword_ThrowsBadRequest() {
        ChangePasswordRequest req = new ChangePasswordRequest("wrongCurrent", NEW_STRONG_PASS, NEW_STRONG_PASS);
        when(passwordEncoder.matches("wrongCurrent", "encodedPassword")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.changePassword(req, activeUser));
        verify(userRepository, never()).save(any());
    }

    @Test
    void forgotPassword_ExistingUser_GeneratesTokenAndDispatchesEmail() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("anil@example.com");
        when(userRepository.findByEmail("anil@example.com")).thenReturn(Optional.of(activeUser));

        MessageResponse response = authService.forgotPassword(req);

        assertNotNull(response);
        verify(passwordResetTokenRepository).invalidateAllPendingForUser(activeUser.getId());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("anil@example.com"), anyString());
    }

    @Test
    void forgotPassword_UnknownUser_ReturnsGenericMessageWithoutDispatch() {
        ForgotPasswordRequest req = new ForgotPasswordRequest("unknown@example.com");
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword(req);

        assertNotNull(response);
        verify(passwordResetTokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void resetPassword_ValidToken_UpdatesPasswordAndRevokesToken() {
        String rawToken = "testToken1234567890abcdef12345678";
        String tokenHash = AuthService.hashToken(rawToken);
        PasswordResetToken tokenEntity = new PasswordResetToken(activeUser, tokenHash, java.time.LocalDateTime.now().plusMinutes(10));

        ResetPasswordRequest req = new ResetPasswordRequest(rawToken, NEW_STRONG_PASS, NEW_STRONG_PASS);
        when(passwordResetTokenRepository.findByTokenHashAndUsedFalseAndExpiresAtAfter(eq(tokenHash), any()))
                .thenReturn(Optional.of(tokenEntity));
        when(passwordEncoder.encode(NEW_STRONG_PASS)).thenReturn("encodedBrandNew");

        MessageResponse response = authService.resetPassword(req);

        assertNotNull(response);
        assertTrue(tokenEntity.isUsed());
        assertEquals("encodedBrandNew", activeUser.getPassword());
        assertNotNull(activeUser.getPasswordChangedAt());
        verify(userRepository).save(activeUser);
        verify(passwordResetTokenRepository).save(tokenEntity);
    }

    @Test
    void resetPassword_InvalidOrExpiredToken_ThrowsBadRequest() {
        ResetPasswordRequest req = new ResetPasswordRequest("expiredOrBad", NEW_STRONG_PASS, NEW_STRONG_PASS);
        when(passwordResetTokenRepository.findByTokenHashAndUsedFalseAndExpiresAtAfter(anyString(), any()))
                .thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> authService.resetPassword(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_SimplifiedEightCharPassword_Passes() {
        RegisterRequest req = new RegisterRequest("simpleuser", "simple@example.com", "Travel@12", "Travel@12");
        when(userRepository.existsByEmail("simple@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Travel@12")).thenReturn("$2a$10$encodedHash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(33L);
            return u;
        });

        AuthResponse resp = authService.register(req);
        assertNotNull(resp);
        assertEquals("simple@example.com", resp.getEmail());
    }

    @Test
    void resetPassword_InvalidNewPassword_ThrowsBadRequestWithoutUsingToken() {
        ResetPasswordRequest req = new ResetPasswordRequest("rawToken123", "Travelpass", "Travelpass");
        assertThrows(BadRequestException.class, () -> authService.resetPassword(req));
        verify(passwordResetTokenRepository, never()).findByTokenHashAndUsedFalseAndExpiresAtAfter(anyString(), any());
        verify(userRepository, never()).save(any());
    }
}
