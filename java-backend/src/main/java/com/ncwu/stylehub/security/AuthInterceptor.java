package com.ncwu.stylehub.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.service.AdminSessionService;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Bearer-token guard mirroring the Python backend dependencies:
 * public catalog reads, /auth/register + /auth/login are open;
 * everything else needs a valid JWT; /api/v1/admin/** requires an admin role.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATTR_USER_ID = "stylehub.userId";
    public static final String ATTR_ROLE = "stylehub.role";

    private final JwtService jwtService;
    private final AdminSessionService adminSessionService;

    public AuthInterceptor(JwtService jwtService, AdminSessionService adminSessionService) {
        this.jwtService = jwtService;
        this.adminSessionService = adminSessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("OPTIONS".equals(method) || isPublic(method, path)) {
            return true;
        }

        if (isOptionalAuth(method, path)) {
            // Guest checkout: a signed-in customer still gets their user id attached,
            // while an anonymous visitor proceeds without one.
            attachIfPresent(request);
            return true;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ApiException(401, "Could not validate credentials");
        }
        try {
            Claims claims = jwtService.parse(header.substring(7));
            long userId = Long.parseLong(claims.getSubject());
            String role = claims.get("role", String.class);
            if (path.startsWith("/api/v1/admin")) {
                if ("admin".equals(role)) {
                    // Only the most recent administrator sign-in may use the admin API.
                    if (!adminSessionService.isCurrent(userId, claims.getId())) {
                        throw new ApiException(401,
                                "This admin session was replaced by a newer sign-in");
                    }
                    request.setAttribute(ATTR_USER_ID, userId);
                    request.setAttribute(ATTR_ROLE, role);
                    return true;
                }
                if (!isDemoAdminRead(method, path, role)) {
                    throw new ApiException(403, "Admin access required");
                }
            }
            request.setAttribute(ATTR_USER_ID, userId);
            request.setAttribute(ATTR_ROLE, role);
            return true;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(401, "Could not validate credentials");
        }
    }

    private void attachIfPresent(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return;
        }
        try {
            Claims claims = jwtService.parse(header.substring(7));
            request.setAttribute(ATTR_USER_ID, Long.parseLong(claims.getSubject()));
            request.setAttribute(ATTR_ROLE, claims.get("role", String.class));
        } catch (Exception ignored) {
            // An expired token must not block a guest checkout.
        }
    }

    /** Endpoints that work with or without a token (guest checkout and order tracking). */
    private boolean isOptionalAuth(String method, String path) {
        if ("POST".equals(method) && path.equals("/api/v1/orders")) {
            return true;
        }
        return "GET".equals(method) && path.equals("/api/v1/orders/track");
    }

    private boolean isDemoAdminRead(String method, String path, String role) {
        if (!"demo_admin".equals(role) || !"GET".equals(method)) {
            return false;
        }
        return path.equals("/api/v1/admin/products")
                || path.matches("/api/v1/admin/products/\\d+")
                || path.equals("/api/v1/admin/reviews")
                || path.equals("/api/v1/admin/stats")
                || path.equals("/api/v1/admin/analytics");
    }

    private boolean isPublic(String method, String path) {
        if (path.equals("/health") || path.startsWith("/uploads")) {
            return true;
        }
        if (path.equals("/api/v1/auth/register") || path.equals("/api/v1/auth/login")
                || path.equals("/api/v1/auth/forgot-password") || path.equals("/api/v1/auth/reset-password")) {
            return true;
        }
        // Anyone can join the NCWU StyleHub Club or send a contact message.
        if ("POST".equals(method) && (path.equals("/api/v1/newsletter") || path.equals("/api/v1/contact"))) {
            return true;
        }
        return "GET".equals(method)
                && (path.startsWith("/api/v1/products")
                        || path.startsWith("/api/v1/categories")
                        || path.startsWith("/api/v1/banners")
                        || path.startsWith("/api/v1/promotions")
                        || path.startsWith("/api/v1/reviews/product"));
    }

    public static long userId(HttpServletRequest request) {
        Object value = request.getAttribute(ATTR_USER_ID);
        if (value == null) {
            throw new ApiException(401, "Could not validate credentials");
        }
        return (long) value;
    }

    /** Signed-in user id, or {@code null} for an anonymous guest request. */
    public static Long optionalUserId(HttpServletRequest request) {
        Object value = request.getAttribute(ATTR_USER_ID);
        return value == null ? null : (long) value;
    }
}
