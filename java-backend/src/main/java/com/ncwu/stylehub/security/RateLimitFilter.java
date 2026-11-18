package com.ncwu.stylehub.security;

import java.io.IOException;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * In-memory sliding-window rate limiter, per client IP:
 * - /api/v1/auth/login + /api/v1/auth/register: 10 requests/minute (brute-force / spam protection)
 * - admin image uploads (POST .../products/{id}/images): 20/minute (heavy 5MB payloads, costly on Cloudinary)
 * - everything else under /api/: 300 requests/minute
 * Requests over the limit get 429 {"detail": ...} with a Retry-After header.
 */
@Component
@Order(2)
public class RateLimitFilter implements Filter {

    private static final long WINDOW_MS = 60_000;
    private static final int AUTH_MAX_PER_MINUTE = 10;
    private static final int UPLOAD_MAX_PER_MINUTE = 20;
    private static final int API_MAX_PER_MINUTE = 300;
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final Map<String, Deque<Long>> windows = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String path = req.getRequestURI();

        if (path.startsWith("/api/")) {
            boolean isAuth = path.equals("/api/v1/auth/login") || path.equals("/api/v1/auth/register");
            boolean isUpload = "POST".equals(req.getMethod()) && path.matches("/api/v1/admin/products/\\d+/images");
            String bucket = isAuth ? "auth" : (isUpload ? "upload" : "api");
            int limit = isAuth ? AUTH_MAX_PER_MINUTE : (isUpload ? UPLOAD_MAX_PER_MINUTE : API_MAX_PER_MINUTE);
            String key = clientIp(req) + "|" + bucket;
            if (!allow(key, limit)) {
                res.setStatus(429);
                res.setContentType("application/json");
                res.setHeader("Retry-After", "60");
                res.getWriter().write("{\"detail\":\"Too many requests — please try again in a minute\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean allow(String key, int limit) {
        long now = System.currentTimeMillis();
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.keySet().removeIf(k -> {
                Deque<Long> q = windows.get(k);
                return q == null || q.isEmpty() || now - q.peekLast() > WINDOW_MS;
            });
        }
        Deque<Long> window = windows.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peekFirst() > WINDOW_MS) {
                window.pollFirst();
            }
            if (window.size() >= limit) {
                return false;
            }
            window.addLast(now);
            return true;
        }
    }

    private static String clientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
