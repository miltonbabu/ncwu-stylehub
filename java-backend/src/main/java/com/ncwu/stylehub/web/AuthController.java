package com.ncwu.stylehub.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ncwu.stylehub.security.AuthInterceptor;
import com.ncwu.stylehub.service.AuthService;
import com.ncwu.stylehub.service.PasswordResetService;
import com.ncwu.stylehub.web.dto.AuthDtos.ForgotPasswordRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.LoginRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.RegisterRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.ResetPasswordRequest;
import com.ncwu.stylehub.web.dto.AuthDtos.Token;
import com.ncwu.stylehub.web.dto.AuthDtos.UserOut;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Token register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public Token login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UserOut me(HttpServletRequest request) {
        return authService.me(AuthInterceptor.userId(request));
    }

    /** Always returns 200 — never reveals whether an account exists. */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.OK)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordResetService.request(req.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.OK)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordResetService.reset(req.token(), req.password());
    }
}
