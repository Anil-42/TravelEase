package com.travelease.controller;

import com.travelease.dto.request.ChangePasswordRequest;
import com.travelease.dto.request.ForgotPasswordRequest;
import com.travelease.dto.request.LoginRequest;
import com.travelease.dto.request.RegisterRequest;
import com.travelease.dto.request.ResetPasswordRequest;
import com.travelease.dto.response.AuthResponse;
import com.travelease.dto.response.MessageResponse;
import com.travelease.dto.response.UserResponse;
import com.travelease.entity.User;
import com.travelease.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserResponse response = new UserResponse(
                currentUser.getId(),
                currentUser.getDisplayName(),
                currentUser.getEmail(),
                currentUser.getRole().name(),
                currentUser.isActive(),
                currentUser.isMustChangePassword(),
                currentUser.getCreatedAt()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        MessageResponse response = authService.changePassword(request, currentUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        MessageResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        MessageResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}
