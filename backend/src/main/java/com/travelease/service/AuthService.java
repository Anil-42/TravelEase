package com.travelease.service;

import com.travelease.config.JwtService;
import com.travelease.config.PasswordPolicyValidator;
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
import com.travelease.exception.UnauthorizedException;
import com.travelease.repository.PasswordResetTokenRepository;
import com.travelease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${travelease.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    @Transactional
    @CacheEvict(value = "admin_dashboard_stats", allEntries = true)
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (request.getConfirmPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match.");
        }

        PasswordPolicyValidator.validate(request.getPassword());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email is already registered. Please log in.");
        }

        // Public registration is strictly locked to ROLE_USER
        User user = new User(
                request.getUsername().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword()),
                Role.ROLE_USER
        );
        user.setActive(true);
        user.setMustChangePassword(false);

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getDisplayName(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.isMustChangePassword()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new DisabledException("Account is deactivated. Please contact support.");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole().name(),
                user.isMustChangePassword()
        );
    }

    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest request, User currentUser) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        PasswordPolicyValidator.validate(request.getNewPassword());

        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), currentUser.getPassword())) {
            throw new BadRequestException("New password cannot be identical to your current password");
        }

        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        currentUser.setMustChangePassword(false);
        currentUser.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(currentUser);

        log.info("Password successfully changed for user id: {}. Existing sessions revoked.", currentUser.getId());
        return new MessageResponse("Password changed successfully. Existing sessions have been revoked.");
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Always return generic confirmation message to prevent user enumeration
        MessageResponse genericSuccessResponse = new MessageResponse(
                "If that email address is in our system, you will receive password reset instructions shortly."
        );

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (!user.isActive()) {
                log.info("Password reset requested for deactivated account user id: {}", user.getId());
                return;
            }

            // Invalidate any existing pending reset tokens for this user
            passwordResetTokenRepository.invalidateAllPendingForUser(user.getId());

            // Generate cryptographically secure 32-byte hex token
            String rawToken = generateSecureToken();
            String tokenHash = hashToken(rawToken);

            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);
            PasswordResetToken resetToken = new PasswordResetToken(user, tokenHash, expiresAt);
            passwordResetTokenRepository.save(resetToken);

            String resetUrl = frontendBaseUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.getEmail(), resetUrl);
            log.info("Password reset token generated and email dispatched for user id: {}", user.getId());
        });

        return genericSuccessResponse;
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        PasswordPolicyValidator.validate(request.getNewPassword());

        String rawToken = request.getToken().trim();
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedFalseAndExpiresAtAfter(tokenHash, LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("Password reset link is invalid or has expired. Please request a new one."));

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset successfully using single-use token for user id: {}", user.getId());
        return new MessageResponse("Password has been reset successfully. Please log in with your new password.");
    }

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute SHA-256 hash", e);
        }
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
