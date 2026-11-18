package com.ncwu.stylehub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.ContactMessage;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.ContactMessageOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ContactRequest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Public contact form submissions, stored for the admin inbox and mirrored to email. */
@Service
public class ContactService {

    @PersistenceContext
    private EntityManager em;

    private final MailService mailService;

    public ContactService(MailService mailService) {
        this.mailService = mailService;
    }

    @Transactional
    public ContactMessageOut submit(ContactRequest req) {
        ContactMessage msg = new ContactMessage();
        msg.name = req.name().trim();
        msg.email = req.email().trim().toLowerCase();
        msg.subject = req.subject() == null ? "" : req.subject().trim();
        msg.message = req.message().trim();
        em.persist(msg);
        mailService.sendContactMessage(msg.name, msg.email, msg.subject, msg.message);
        return toOut(msg);
    }

    @Transactional(readOnly = true)
    public List<ContactMessageOut> messages() {
        return em.createQuery("SELECT m FROM ContactMessage m ORDER BY m.createdAt DESC", ContactMessage.class)
                .getResultList().stream().map(ContactService::toOut).toList();
    }

    @Transactional
    public void markRead(long id) {
        ContactMessage msg = em.find(ContactMessage.class, id);
        if (msg == null) {
            throw new ApiException(404, "Message not found");
        }
        msg.isRead = true;
    }

    @Transactional
    public void delete(long id) {
        ContactMessage msg = em.find(ContactMessage.class, id);
        if (msg == null) {
            throw new ApiException(404, "Message not found");
        }
        em.remove(msg);
    }

    private static ContactMessageOut toOut(ContactMessage m) {
        return new ContactMessageOut(m.id, m.name, m.email, m.subject, m.message, m.isRead, m.createdAt);
    }
}
