package com.ncwu.stylehub.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.PasswordResetToken;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.security.PasswordHasher;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Forgot-password flow.
 * Requesting a reset never reveals whether an email exists (no account enumeration), and the raw
 * token is only ever sent by email — the database stores just its hash.
 */
@Service
public class PasswordResetService {

    private static final int TOKEN_TTL_MINUTES = 60;
    private static final SecureRandom RANDOM = new SecureRandom();

    @PersistenceContext
    private EntityManager em;

    private final MailService mailService;

    public PasswordResetService(MailService mailService) {
        this.mailService = mailService;
    }

    @Transactional
    public void request(String email) {
        User user = em.createQuery("SELECT u FROM User u WHERE u.email = :e", User.class)
                .setParameter("e", email.trim().toLowerCase())
                .getResultStream().findFirst().orElse(null);
        if (user == null || !user.isActive) {
            return;
        }

        // Invalidate any outstanding links for this account.
        em.createQuery("DELETE FROM PasswordResetToken t WHERE t.user.id = :uid")
                .setParameter("uid", user.id).executeUpdate();

        PasswordResetToken token = new PasswordResetToken();
        token.user = user;
        String raw = rawToken();
        token.tokenHash = sha256(raw);
        token.expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(TOKEN_TTL_MINUTES);
        em.persist(token);

        mailService.sendPasswordReset(user, raw);
    }

    @Transactional
    public void reset(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ApiException(400, "Reset link is invalid");
        }
        PasswordResetToken token = em.createQuery(
                        "SELECT t FROM PasswordResetToken t WHERE t.tokenHash = :h", PasswordResetToken.class)
                .setParameter("h", sha256(rawToken.trim()))
                .getResultStream().findFirst().orElse(null);

        if (token == null || token.used) {
            throw new ApiException(400, "This reset link is invalid or has already been used");
        }
        if (token.expiresAt.isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new ApiException(400, "This reset link has expired — please request a new one");
        }

        User user = token.user;
        user.passwordHash = PasswordHasher.hash(newPassword);
        token.used = true;

        em.createQuery("DELETE FROM PasswordResetToken t WHERE t.user.id = :uid AND t.id <> :keep")
                .setParameter("uid", user.id).setParameter("keep", token.id).executeUpdate();
    }

    /** Remaining token lifetime in minutes (exposed for tests/logging). */
    public static int ttlMinutes() {
        return TOKEN_TTL_MINUTES;
    }

    private static String rawToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
