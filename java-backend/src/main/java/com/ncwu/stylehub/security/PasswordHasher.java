package com.ncwu.stylehub.security;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.HexFormat;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * PBKDF2-HMAC-SHA256 password hashing, byte-compatible with the Python backend
 * (same iterations, salt size and "saltHex$hashHex" storage format).
 */
public final class PasswordHasher {

    private static final int ITERATIONS = 100_000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;

    private PasswordHasher() {
    }

    public static String hash(String password) {
        byte[] salt = new byte[SALT_BYTES];
        new SecureRandom().nextBytes(salt);
        byte[] digest = derive(password, salt);
        return HexFormat.of().formatHex(salt) + "$" + HexFormat.of().formatHex(digest);
    }

    public static boolean verify(String password, String stored) {
        if (stored == null || !stored.contains("$")) {
            return false;
        }
        String[] parts = stored.split("\\$", 2);
        byte[] salt = HexFormat.of().parseHex(parts[0]);
        byte[] digest = derive(password, salt);
        return MessageDigest.isEqual(digest, HexFormat.of().parseHex(parts[1]));
    }

    private static byte[] derive(String password, byte[] salt) {
        try {
            KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new IllegalStateException("Password hashing failed", e);
        }
    }
}
