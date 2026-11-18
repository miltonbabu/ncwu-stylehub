package com.ncwu.stylehub.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.ncwu.stylehub.exception.ApiException;

import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Bearer-token guard mirroring the Python backend dependencies:
 * public catalog reads, /auth/register + /auth/login are open;
 * everything else needs a valid JWT; /api/v1/admin/** additionally needs role=admin.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATTR_USER_ID = "stylehub.userId";
    public static final String ATTR_ROLE = "stylehub.role";

    private final JwtService jwtService;

    public AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("OPTIONS".equals(method) || isPublic(method, path)) {
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
            if (path.startsWith("/api/v1/admin") && !"admin".equals(role)) {
                throw new ApiException(403, "Admin access required");
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
}
