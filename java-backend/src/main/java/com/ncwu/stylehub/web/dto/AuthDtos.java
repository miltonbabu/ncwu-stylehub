package com.ncwu.stylehub.web.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Auth request/response DTOs — JSON keys match the Python API via SNAKE_CASE naming. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String name,
            @Email @NotBlank String email,
            @Size(min = 8, max = 128) String password) {
    }

    public record LoginRequest(
            @NotBlank String email,
            @NotBlank String password) {
    }

    public record ForgotPasswordRequest(@Email @NotBlank String email) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @Size(min = 8, max = 128) String password) {
    }

    public record UserOut(
            long id,
            String name,
            String email,
            String role,
            boolean isActive,
            LocalDateTime createdAt) {
    }

    public record Token(String accessToken, String tokenType, UserOut user) {
    }
}
