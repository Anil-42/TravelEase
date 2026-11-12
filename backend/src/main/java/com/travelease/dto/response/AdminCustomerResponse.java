package com.travelease.dto.response;

import com.travelease.entity.Role;

import java.time.LocalDateTime;

public class AdminCustomerResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
    private long bookingCount;

    public AdminCustomerResponse() {
    }

    public AdminCustomerResponse(Long id, String username, String email, Role role,
                                 boolean active, LocalDateTime createdAt, long bookingCount) {
        this(id, username, email, role != null ? role.name() : Role.ROLE_USER.name(), active, createdAt, bookingCount);
    }

    public AdminCustomerResponse(Long id, String username, String email, String role,
                                 boolean active, LocalDateTime createdAt, long bookingCount) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.role = role;
        this.active = active;
        this.createdAt = createdAt;
        this.bookingCount = bookingCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getBookingCount() {
        return bookingCount;
    }

    public void setBookingCount(long bookingCount) {
        this.bookingCount = bookingCount;
    }
}
