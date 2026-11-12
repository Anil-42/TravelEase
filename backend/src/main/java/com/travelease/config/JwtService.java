package com.travelease.config;

import com.travelease.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${travelease.jwt.secret:}")
    private String secretKey;

    @Value("${travelease.jwt.expiration-ms:86400000}")
    private long jwtExpiration = 86400000L;

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public void setJwtExpiration(long jwtExpiration) {
        this.jwtExpiration = jwtExpiration;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                    "JWT signing secret is not configured. Please set the JWT_SECRET environment variable (minimum 32 bytes)."
            );
        }
        byte[] keyBytes = decodeSecretBytes(secretKey);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET is too short (" + keyBytes.length + " bytes). Provide a cryptographically random secret of at least 32 bytes (256 bits)."
            );
        }
    }

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("username", user.getDisplayName());
        extraClaims.put("role", user.getRole().name());
        return generateToken(extraClaims, user);
    }

    public String generateToken(Map<String, Object> extraClaims, User user) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(user.getEmail())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, User user) {
        final String email = extractEmail(token);
        return (email.equals(user.getEmail())) && !isTokenExpired(token);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Number) {
            return ((Number) userIdObj).longValue();
        }
        return null;
    }

    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("role");
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT signing secret is not configured. Please set the JWT_SECRET environment variable.");
        }
        byte[] keyBytes = decodeSecretBytes(secretKey);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT signing secret must be at least 32 bytes (256 bits).");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private byte[] decodeSecretBytes(String secret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(secret.trim());
            if (decoded.length >= 32) {
                return decoded;
            }
        } catch (Exception ignored) {
            // Treat as raw UTF-8 secret when not valid Base64
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }
}
