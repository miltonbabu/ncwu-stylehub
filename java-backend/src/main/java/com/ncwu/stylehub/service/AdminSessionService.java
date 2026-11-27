package com.ncwu.stylehub.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.AdminSession;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Enforces one administrator session at a time.
 *
 * Signing in as an administrator replaces the stored session, so a second
 * login kicks the first one out — logging in always works and nobody can get
 * permanently locked out. Customer sessions are not tracked here.
 */
@Service
public class AdminSessionService {

    /** The table holds a single row, so a fixed id keeps the lookup trivial. */
    private static final long ACTIVE_ROW_ID = 1L;

    @PersistenceContext
    private EntityManager em;

    @Transactional
    public void activate(long userId, String jti) {
        AdminSession session = em.find(AdminSession.class, ACTIVE_ROW_ID);
        if (session == null) {
            session = new AdminSession();
            session.id = ACTIVE_ROW_ID;
            session.userId = userId;
            session.jti = jti;
            em.persist(session);
            return;
        }
        session.userId = userId;
        session.jti = jti;
        session.issuedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    @Transactional(readOnly = true)
    public boolean isCurrent(long userId, String jti) {
        AdminSession session = em.find(AdminSession.class, ACTIVE_ROW_ID);
        // A database that has never seen an admin login lets the first token through.
        return session == null || (session.userId == userId && session.jti.equals(jti));
    }
}
