package com.ncwu.stylehub.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.config.Env;
import com.ncwu.stylehub.domain.AdminDeleteQuota;
import com.ncwu.stylehub.exception.ApiException;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Caps destructive actions for the demo administrator shown on the sign-in page.
 *
 * That account is a test login, not a super administrator, so it may remove at
 * most {@value #LIMIT} products and {@value #LIMIT} orders. Any other admin
 * account is unaffected and can delete freely.
 */
@Service
public class AdminDeleteQuotaService {

    private static final int LIMIT = 2;
    private static final long ROW_ID = 1L;
    private static final String TEST_ADMIN_EMAIL = Env.get("ADMIN_EMAIL", "admin@shop.ncwu.site");

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void assertCanDeleteProduct(long userId) {
        if (!isTestAdmin(userId)) {
            return;
        }
        if (current().productsDeleted >= LIMIT) {
            throw new ApiException(403, warning("products"));
        }
    }

    @Transactional
    public void recordProductDelete(long userId) {
        if (!isTestAdmin(userId)) {
            return;
        }
        current().productsDeleted++;
    }

    @Transactional
    public void assertCanDeleteOrder(long userId) {
        if (!isTestAdmin(userId)) {
            return;
        }
        if (current().ordersDeleted >= LIMIT) {
            throw new ApiException(403, warning("orders"));
        }
    }

    @Transactional
    public void recordOrderDelete(long userId) {
        if (!isTestAdmin(userId)) {
            return;
        }
        current().ordersDeleted++;
    }

    /** Only the sign-in page test administrator is capped; other admins are not. */
    private boolean isTestAdmin(long userId) {
        Long testAdminId = em.createQuery("SELECT u.id FROM User u WHERE u.email = :e", Long.class)
                .setParameter("e", TEST_ADMIN_EMAIL)
                .getResultStream()
                .findFirst()
                .orElse(null);
        return testAdminId != null && testAdminId == userId;
    }

    private String warning(String what) {
        return "This is a test admin account, not a super admin. It can delete at most "
                + LIMIT + " " + what + ". Please do not delete any more.";
    }

    private AdminDeleteQuota current() {
        AdminDeleteQuota quota = em.find(AdminDeleteQuota.class, ROW_ID);
        if (quota == null) {
            quota = new AdminDeleteQuota();
            quota.id = ROW_ID;
            em.persist(quota);
        }
        return quota;
    }
}
