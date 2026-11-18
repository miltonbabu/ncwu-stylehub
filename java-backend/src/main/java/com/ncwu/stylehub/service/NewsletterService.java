package com.ncwu.stylehub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Subscriber;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.SubscriberOut;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** NCWU StyleHub Club subscriptions — stored server-side, one row per email. */
@Service
public class NewsletterService {

    @PersistenceContext
    private EntityManager em;

    private final MailService mailService;

    public NewsletterService(MailService mailService) {
        this.mailService = mailService;
    }

    /** Idempotent: re-subscribing an existing email is a no-op that still succeeds. */
    @Transactional
    public SubscriberOut subscribe(String rawEmail) {
        String email = normalize(rawEmail);
        if (email.isEmpty()) {
            throw new ApiException(400, "Email is required");
        }
        List<Subscriber> existing = em
                .createQuery("SELECT s FROM Subscriber s WHERE s.email = :e", Subscriber.class)
                .setParameter("e", email)
                .getResultList();
        if (!existing.isEmpty()) {
            Subscriber sub = existing.get(0);
            if (!sub.isActive) {
                sub.isActive = true;
                mailService.sendClubWelcome(sub.email);
            }
            return toOut(sub);
        }
        Subscriber sub = new Subscriber();
        sub.email = email;
        em.persist(sub);
        mailService.sendClubWelcome(sub.email);
        return toOut(sub);
    }

    @Transactional(readOnly = true)
    public List<SubscriberOut> subscribers() {
        return em.createQuery("SELECT s FROM Subscriber s ORDER BY s.createdAt DESC", Subscriber.class)
                .getResultList().stream().map(NewsletterService::toOut).toList();
    }

    @Transactional(readOnly = true)
    public long count() {
        Long value = em.createQuery("SELECT COUNT(s) FROM Subscriber s WHERE s.isActive = true", Long.class)
                .getSingleResult();
        return value == null ? 0L : value;
    }

    @Transactional
    public void delete(long id) {
        Subscriber sub = em.find(Subscriber.class, id);
        if (sub == null) {
            throw new ApiException(404, "Subscriber not found");
        }
        em.remove(sub);
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static SubscriberOut toOut(Subscriber s) {
        return new SubscriberOut(s.id, s.email, s.source, s.isActive, s.createdAt);
    }
}
