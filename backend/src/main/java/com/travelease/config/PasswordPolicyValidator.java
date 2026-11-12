package com.travelease.config;

import com.travelease.exception.BadRequestException;

/**
 * Enforces the platform password policy across registration,
 * password changes, password resets, and admin bootstrap workflows:
 * 8-128 characters, uppercase (A-Z), lowercase (a-z), digit (0-9),
 * special character, and no leading/trailing whitespace.
 */
public final class PasswordPolicyValidator {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 128;

    private PasswordPolicyValidator() {
    }

    /**
     * Validates password against the simplified security policy.
     *
     * @param password plaintext password candidate
     * @throws BadRequestException if any requirement is violated
     */
    public static void validate(String password) {
        if (password == null || password.isEmpty()) {
            throw new BadRequestException("Password is required.");
        }

        if (Character.isWhitespace(password.charAt(0))
                || Character.isWhitespace(password.charAt(password.length() - 1))) {
            throw new BadRequestException("Password must not start or end with whitespace.");
        }

        if (password.length() < MIN_LENGTH) {
            throw new BadRequestException("Password must be at least 8 characters long.");
        }

        if (password.length() > MAX_LENGTH) {
            throw new BadRequestException("Password must not exceed 128 characters.");
        }

        if (!password.chars().anyMatch(ch -> ch >= 'A' && ch <= 'Z')) {
            throw new BadRequestException("Password must contain at least one uppercase letter (A-Z).");
        }

        if (!password.chars().anyMatch(ch -> ch >= 'a' && ch <= 'z')) {
            throw new BadRequestException("Password must contain at least one lowercase letter (a-z).");
        }

        if (!password.chars().anyMatch(ch -> ch >= '0' && ch <= '9')) {
            throw new BadRequestException("Password must contain at least one number (0-9).");
        }

        boolean hasSpecial = password.chars().anyMatch(ch ->
                !(ch >= 'A' && ch <= 'Z')
                        && !(ch >= 'a' && ch <= 'z')
                        && !(ch >= '0' && ch <= '9')
                        && !Character.isWhitespace(ch)
        );
        if (!hasSpecial) {
            throw new BadRequestException("Password must contain at least one special character.");
        }
    }

    public static boolean isCompliant(String password) {
        try {
            validate(password);
            return true;
        } catch (BadRequestException ex) {
            return false;
        }
    }
}
