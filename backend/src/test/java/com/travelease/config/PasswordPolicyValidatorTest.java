package com.travelease.config;

import com.travelease.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordPolicyValidatorTest {

    @Test
    void validate_ValidPasswords_Pass() {
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Travel@123"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("HelloWorld#2026"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("MyPass!789"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Travel@12"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Password@1"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Admin@123"));
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Aaa@1111"));
        assertTrue(PasswordPolicyValidator.isCompliant("Travel@12"));
    }

    @Test
    void validate_ExactBoundaryLengths_Pass() {
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate("Abc@1234"));
        String maxLen = "Abc@1234" + "a".repeat(120);
        assertEquals(128, maxLen.length());
        assertDoesNotThrow(() -> PasswordPolicyValidator.validate(maxLen));
    }

    @Test
    void validate_TooShort_ThrowsBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("Travel@"));
        assertTrue(ex.getMessage().contains("8 characters"));
    }

    @Test
    void validate_TooLong_ThrowsBadRequest() {
        String overMax = "A1@" + "a".repeat(126);
        assertEquals(129, overMax.length());
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate(overMax));
        assertTrue(ex.getMessage().contains("128 characters"));
    }

    @Test
    void validate_LeadingOrTrailingWhitespace_ThrowsBadRequest() {
        BadRequestException leadEx = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate(" Travel@123"));
        assertTrue(leadEx.getMessage().contains("whitespace"));

        BadRequestException trailEx = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("Travel@123 "));
        assertTrue(trailEx.getMessage().contains("whitespace"));
    }

    @Test
    void validate_MissingUppercase_ThrowsBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("travel@123"));
        assertTrue(ex.getMessage().contains("uppercase"));
    }

    @Test
    void validate_MissingLowercase_ThrowsBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("TRAVEL@123"));
        assertTrue(ex.getMessage().contains("lowercase"));
    }

    @Test
    void validate_MissingNumber_ThrowsBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("Travelpass"));
        assertTrue(ex.getMessage().contains("number"));
    }

    @Test
    void validate_MissingSpecialCharacter_ThrowsBadRequest() {
        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> PasswordPolicyValidator.validate("Travel123"));
        assertTrue(ex.getMessage().contains("special character"));
    }
}
