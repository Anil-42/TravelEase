package com.travelease.config;

import com.travelease.entity.User;
import com.travelease.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractEmail(jwt);
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = this.userRepository.findByEmail(userEmail).orElse(null);

                if (user != null && jwtService.isTokenValid(jwt, user) && user.isEnabled()) {
                    // Invalidate JWT sessions issued prior to password change/reset
                    if (user.getPasswordChangedAt() != null) {
                        java.util.Date issuedAt = jwtService.extractIssuedAt(jwt);
                        long changedAtSeconds = user.getPasswordChangedAt()
                                .atZone(java.time.ZoneId.systemDefault())
                                .toEpochSecond();
                        long tokenIssuedAtSeconds = issuedAt != null ? (issuedAt.getTime() / 1000L) : 0L;

                        if (tokenIssuedAtSeconds < changedAtSeconds) {
                            logger.debug("Rejected JWT token issued prior to password change for user id: " + user.getId());
                            filterChain.doFilter(request, response);
                            return;
                        }
                    }

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            user.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Invalid token or expired; let security context remain empty so Spring Security rejects with 401
            logger.debug("Failed to authenticate JWT token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
