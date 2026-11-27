package com.ncwu.stylehub.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Small forward-only schema patch that Hibernate's {@code ddl-auto=update} cannot express:
 * guest checkout stores orders without an account, so {@code orders.user_id} must allow NULL.
 * Hibernate adds new columns/tables but never relaxes an existing NOT NULL constraint.
 *
 * <p>Both dialects are attempted so the same build works on the local H2 file database and on
 * PostgreSQL (Supabase). Each statement runs on its own connection, so a rejected dialect
 * cannot poison an open transaction.
 */
@Component
public class SchemaPatch {

    private static final Logger log = LoggerFactory.getLogger(SchemaPatch.class);

    private static final List<String> RELAX_ORDER_USER = List.of(
            "ALTER TABLE orders ALTER COLUMN user_id SET NULL",      // H2
            "ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL"  // PostgreSQL
    );

    private final JdbcTemplate jdbc;

    public SchemaPatch(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void relaxOrderUser() {
        for (String sql : RELAX_ORDER_USER) {
            try {
                jdbc.execute(sql);
                log.debug("Guest checkout enabled: {}", sql);
                return;
            } catch (Exception ignored) {
                // Wrong dialect for this database — try the next form.
            }
        }
        log.warn("Could not make orders.user_id nullable; guest orders will be rejected. "
                + "Run: ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;");
    }
}
