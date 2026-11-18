package com.ncwu.stylehub.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.ncwu.stylehub.config.Env;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** HS256 JWT service — tokens are interchangeable with the Python backend when SECRET_KEY matches. */
@Service
public class JwtService {

    private final SecretKey key;
    private final int expireMinutes;

    public JwtService() {
        String secret = Env.get("SECRET_KEY");
        if (secret == null || secret.isBlank()) {
            // No configured key: sign with a random per-boot key so tokens can never be
            // forged from a known default. Set SECRET_KEY for tokens that survive restarts.
            byte[] random = new byte[32];
            new java.security.SecureRandom().nextBytes(random);
            secret = java.util.HexFormat.of().formatHex(random);
            org.slf4j.LoggerFactory.getLogger(JwtService.class)
                    .warn("SECRET_KEY is not set — generated a random per-boot signing key. "
                            + "Set the SECRET_KEY environment variable so tokens stay valid across restarts!");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMinutes = Integer.parseInt(Env.get("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"));
    }

    public String create(long userId, String role) {
        Instant exp = Instant.now().plus(expireMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
