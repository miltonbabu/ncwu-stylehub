package com.ncwu.stylehub.config;

import java.util.List;

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
 * Keeps the demo customer valid on every startup and removes old test accounts.
 *
 *   Customer user@shop.ncwu.site  / demo@123
 *
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true", matchIfMissing = true)
public class DemoAccounts implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccounts.class);

    private static final String USER_EMAIL = "user@shop.ncwu.site";
    private static final String USER_PASSWORD = "demo@123";

    /** Accounts created during earlier test runs — safe to remove. */
    private static final List<String> TEST_ACCOUNTS = List.of(
            "del-test-java@example.com",
            "diag-test4@example.com");

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureDemo("Demo Customer", USER_EMAIL, USER_PASSWORD, "customer");
        removeTestAccounts();
    }

    private void ensureDemo(String name, String email, String password, String role) {
        User target = find(email);
        if (target == null) {
            target = new User();
            target.name = name;
            target.email = email;
            target.role = role;
            target.isActive = true;
            target.passwordHash = PasswordHasher.hash(password);
            em.persist(target);
            log.info("Created demo account {}.", email);
            return;
        }
        // Documented credentials should always work in this demo store.
        target.passwordHash = PasswordHasher.hash(password);
        target.role = role;
        target.isActive = true;
        if (target.name == null || target.name.isBlank()) {
            target.name = name;
        }
    }

    private void removeTestAccounts() {
        for (String email : TEST_ACCOUNTS) {
            User user = find(email);
            if (user == null) {
                continue;
            }
            // Users with order history cannot be deleted (FK) — deactivate them instead.
            Long orders = em.createQuery("SELECT COUNT(o) FROM PurchaseOrder o WHERE o.user.id = :id", Long.class)
                    .setParameter("id", user.id)
                    .getSingleResult();
            if (orders != null && orders > 0) {
                user.isActive = false;
                log.info("Deactivated leftover test account {} (it has order history).", email);
                continue;
            }
            em.remove(user);
            log.info("Removed leftover test account {}.", email);
        }
    }

    private User find(String email) {
        List<User> rows = em.createQuery("SELECT u FROM User u WHERE u.email = :e", User.class)
                .setParameter("e", email)
                .getResultList();
        return rows.isEmpty() ? null : rows.get(0);
    }
}
