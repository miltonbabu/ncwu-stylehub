package com.ncwu.stylehub.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Environment lookup that reads a real OS environment variable first, then falls
 * back to a local {@code .env} file next to the working directory. This keeps
 * production behavior unchanged (real env vars win) while letting local runs pick
 * up values from {@code java-backend/.env} without exporting them into the shell.
 *
 * <p>The file uses simple {@code KEY=value} lines; blank lines and lines starting
 * with {@code #} are ignored. Values are not quoted-unwrapped beyond a single
 * matching pair of surrounding quotes.
 */
public final class Env {

    private static final Map<String, String> FILE_VALUES = loadFile();

    private Env() {
    }

    public static String get(String key) {
        String os = System.getenv(key);
        if (os != null && !os.isBlank()) {
            return os.trim();
        }
        return FILE_VALUES.get(key);
    }

    public static String get(String key, String fallback) {
        String value = get(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static Map<String, String> loadFile() {
        Map<String, String> values = new HashMap<>();
        Path envFile = Path.of(System.getProperty("user.dir", "."), ".env");
        if (!Files.exists(envFile)) {
            return values;
        }
        try {
            List<String> lines = Files.readAllLines(envFile);
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eq = trimmed.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, eq).trim();
                String value = trimmed.substring(eq + 1).trim();
                if (value.length() >= 2) {
                    char first = value.charAt(0);
                    char last = value.charAt(value.length() - 1);
                    if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                        value = value.substring(1, value.length() - 1).trim();
                    }
                }
                values.put(key, value);
            }
        } catch (IOException ignored) {
            // Missing/unreadable .env simply means we rely on OS env vars only.
        }
        return values;
    }
}
