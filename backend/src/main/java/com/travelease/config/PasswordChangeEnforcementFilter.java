package com.travelease.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelease.dto.response.ErrorResponse;
import com.travelease.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Enforces mandatory password rotation for accounts flagged with mustChangePassword=true.
 * Prevents access to protected customer or administrative endpoints until the user updates their temporary password.
 */
@Component
public class PasswordChangeEnforcementFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    public PasswordChangeEnforcementFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof User user) {
            if (user.isMustChangePassword() && !isAllowedDuringPasswordChange(request)) {
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                ErrorResponse err = new ErrorResponse(
                        HttpStatus.FORBIDDEN.value(),
                        "Password Change Required",
                        "You must change your temporary password before accessing other resources."
                );
                objectMapper.writeValue(response.getWriter(), err);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedDuringPasswordChange(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (HttpMethod.OPTIONS.matches(method)) {
            return true;
        }
        if (path.equals("/api/auth/change-password")
                || path.equals("/api/auth/me")
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")) {
            return true;
        }
        if (HttpMethod.GET.matches(method) && path.startsWith("/api/packages") && !path.startsWith("/api/packages/admin")) {
            return true;
        }
        return HttpMethod.POST.matches(method) && path.equals("/api/contact");
    }
}
