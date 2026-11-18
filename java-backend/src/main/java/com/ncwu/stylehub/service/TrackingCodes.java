package com.ncwu.stylehub.service;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** Generates human-friendly parcel codes such as NCWU-261115-A7K2P9. */
public final class TrackingCodes {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyMMdd");

    private TrackingCodes() {
    }

    public static String forDate(LocalDate date) {
        StringBuilder suffix = new StringBuilder();
        for (int i = 0; i < 6; i += 1) {
            suffix.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return "NCWU-" + date.format(DATE) + "-" + suffix;
    }

    public static String now() {
        return forDate(LocalDate.now());
    }
}
