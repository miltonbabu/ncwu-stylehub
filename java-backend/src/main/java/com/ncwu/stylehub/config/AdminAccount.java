package com.ncwu.stylehub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.security.PasswordHasher;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Guarantees the single administrator login used by the admin panel.
 *
 *   admin@shop.ncwu.site / t00
 *
 * The previous read-only demo administrator is removed on startup.
 */
@Component
public class AdminAccount implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccount.class);

    private static final String EMAIL = Env.get("ADMIN_EMAIL", "admin@shop.ncwu.site");
    private static final String PASSWORD = Env.get("ADMIN_PASSWORD", "t00");
    private static final String LEGACY_DEMO_EMAIL = Env.get("DEMO_ADMIN_EMAIL", "demo-admin@shop.ncwu.site");

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        withdrawLegacyDemoAdmin();
        ensureAdmin();
    }

    private void ensureAdmin() {
        User admin = find(EMAIL);
        if (admin == null) {
            admin = new User();
            admin.name = "Store Admin";
            admin.email = EMAIL;
            admin.role = "admin";
            admin.isActive = true;
            // Every required field must be set before persist: the generated id
            // forces Hibernate to insert immediately.
            admin.passwordHash = PasswordHasher.hash(PASSWORD);
            em.persist(admin);
            log.info("Created administrator account {}.", EMAIL);
            return;
        }
        // The documented credentials must always work, so they are re-applied on boot.
        admin.passwordHash = PasswordHasher.hash(PASSWORD);
        admin.role = "admin";
        admin.isActive = true;
        if (admin.name == null || admin.name.isBlank()) {
            admin.name = "Store Admin";
        }
    }

    /** Retires the old restricted demo administrator so only the real admin remains. */
    private void withdrawLegacyDemoAdmin() {
        User legacy = find(LEGACY_DEMO_EMAIL);
        if (legacy == null || !"demo_admin".equals(legacy.role)) {
            return;
        }
        Long orders = em.createQuery("SELECT COUNT(o) FROM PurchaseOrder o WHERE o.user.id = :id", Long.class)
                .setParameter("id", legacy.id)
                .getSingleResult();
        if (orders != null && orders > 0) {
            legacy.isActive = false;
            log.info("Disabled legacy demo administrator {} (it has order history).", LEGACY_DEMO_EMAIL);
            return;
        }
        em.remove(legacy);
        log.info("Removed legacy demo administrator {}.", LEGACY_DEMO_EMAIL);
    }

    private User find(String email) {
        return em.createQuery("SELECT u FROM User u WHERE u.email = :e", User.class)
                .setParameter("e", email)
                .getResultStream()
                .findFirst()
                .orElse(null);
    }
}
