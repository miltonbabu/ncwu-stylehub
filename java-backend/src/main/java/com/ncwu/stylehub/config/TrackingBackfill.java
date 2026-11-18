package com.ncwu.stylehub.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.service.TrackingCodes;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * One-time, idempotent backfill: orders placed before tracking codes existed get one
 * derived from their own order date. Runs on every boot but only touches blank rows.
 */
@Component
public class TrackingBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TrackingBackfill.class);

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Order> missing = em.createQuery(
                        "SELECT o FROM PurchaseOrder o WHERE o.trackingNumber IS NULL OR o.trackingNumber = ''",
                        Order.class)
                .getResultList();
        if (missing.isEmpty()) {
            return;
        }
        for (Order order : missing) {
            order.trackingNumber = TrackingCodes.forDate(order.createdAt.toLocalDate());
        }
        log.info("Backfilled tracking codes for {} existing order(s).", missing.size());
    }
}
