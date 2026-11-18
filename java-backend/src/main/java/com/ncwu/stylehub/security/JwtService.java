package com.ncwu.stylehub.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** HS256 JWT service — tokens are interchangeable with the Python backend when SECRET_KEY matches. */
@Service
public class JwtService {

    private final SecretKey key;
    private final int expireMinutes;

    public JwtService() {
        String secret = System.getenv().getOrDefault(
                "SECRET_KEY", "ncwu-stylehub-dev-secret-change-in-production");
        if ("ncwu-stylehub-dev-secret-change-in-production".equals(secret)) {
            org.slf4j.LoggerFactory.getLogger(JwtService.class)
                    .warn("SECRET_KEY is not set — using the insecure development default. "
                            + "Set the SECRET_KEY environment variable in production!");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMinutes = Integer.parseInt(
                System.getenv().getOrDefault("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"));
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
