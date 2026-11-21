package com.ncwu.stylehub.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.security.PasswordHasher;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Creates a separate, read-only admin demo without modifying any real administrator. */
@Component
@ConditionalOnProperty(name = "app.demo.admin.enabled", havingValue = "true", matchIfMissing = true)
public class DemoAdminAccount implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAdminAccount.class);
    private static final String EMAIL = Env.get("DEMO_ADMIN_EMAIL", "demo-admin@shop.ncwu.site");
    private static final String PASSWORD = Env.get("DEMO_ADMIN_PASSWORD", "demo-admin@123");

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User user = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                .setParameter("email", EMAIL)
                .getResultStream()
                .findFirst()
                .orElse(null);
        if (user != null && "admin".equals(user.role)) {
            log.warn("Demo admin email {} belongs to a full administrator; leaving that account unchanged.", EMAIL);
            return;
        }
        if (user == null) {
            user = new User();
            user.name = "Demo Admin";
            user.email = EMAIL;
            em.persist(user);
        }
        user.passwordHash = PasswordHasher.hash(PASSWORD);
        user.role = "demo_admin";
        user.isActive = true;
        log.info("Demo admin account is available as {} with restricted read-only access.", EMAIL);
    }
}
