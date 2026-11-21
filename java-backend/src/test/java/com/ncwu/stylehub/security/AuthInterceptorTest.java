package com.ncwu.stylehub.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import com.ncwu.stylehub.exception.ApiException;

class AuthInterceptorTest {

    private JwtService jwtService;
    private AuthInterceptor interceptor;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        interceptor = new AuthInterceptor(jwtService);
    }

    @Test
    void demoAdminCanReadOnlyTheApprovedDemoEndpoints() {
        assertAllowed("GET", "/api/v1/admin/products");
        assertAllowed("GET", "/api/v1/admin/products/12");
        assertAllowed("GET", "/api/v1/admin/reviews");
        assertAllowed("GET", "/api/v1/admin/stats");
        assertAllowed("GET", "/api/v1/admin/analytics");
    }

    @Test
    void demoAdminCannotMutateOrReadSensitiveAdminResources() {
        assertForbidden("DELETE", "/api/v1/admin/products/12");
        assertForbidden("POST", "/api/v1/admin/products");
        assertForbidden("POST", "/api/v1/admin/reviews/12/approve");
        assertForbidden("DELETE", "/api/v1/admin/reviews/12");
        assertForbidden("GET", "/api/v1/admin/users");
        assertForbidden("GET", "/api/v1/admin/orders");
        assertForbidden("GET", "/api/v1/admin/contact-messages");
        assertForbidden("GET", "/api/v1/admin/newsletter");
    }

    @Test
    void demoCustomerCannotUseAdminEndpoints() {
        assertForbidden("DELETE", "/api/v1/admin/products/12", "customer");
        assertForbidden("GET", "/api/v1/admin/reviews", "customer");
        assertForbidden("GET", "/api/v1/admin/users", "customer");
    }

    @Test
    void regularAdminKeepsFullAdminAccess() {
        assertAllowed("DELETE", "/api/v1/admin/products/12", "admin");
        assertAllowed("GET", "/api/v1/admin/users", "admin");
    }

    private void assertAllowed(String method, String path) {
        assertAllowed(method, path, "demo_admin");
    }

    private void assertAllowed(String method, String path, String role) {
        MockHttpServletRequest request = request(method, path, role);
        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
        assertEquals(42L, AuthInterceptor.userId(request));
    }

    private void assertForbidden(String method, String path) {
        assertForbidden(method, path, "demo_admin");
    }

    private void assertForbidden(String method, String path, String role) {
        MockHttpServletRequest request = request(method, path, role);
        ApiException error = assertThrows(ApiException.class,
                () -> interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
        assertEquals(403, error.getStatus());
    }

    private MockHttpServletRequest request(String method, String path, String role) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.addHeader("Authorization", "Bearer " + jwtService.create(42L, role));
        return request;
    }
}
