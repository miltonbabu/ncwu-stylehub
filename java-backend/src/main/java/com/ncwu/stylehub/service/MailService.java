package com.ncwu.stylehub.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.ncwu.stylehub.config.Env;
import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.RefundRequest;
import com.ncwu.stylehub.domain.User;

/**
 * Transactional email through Resend (https://resend.com).
 *
 * The API key lives only in this process (env var RESEND_API_KEY) and is never sent to the browser.
 * Sending is fire-and-forget: a mail failure must never break checkout or signup.
 *
 * <p>Markup is rendered by {@link MailTemplates}: table-based, inline-styled, with a plain-text
 * alternative, so every message stays readable in Gmail, Outlook, Apple Mail and mobile clients.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private static final String ENDPOINT = "https://api.resend.com/emails";

    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String apiKey = Env.get("RESEND_API_KEY", "");
    private final String from = Env.get("MAIL_FROM", "NCWU StyleHub <info@shop.ncwu.site>");
    private final String siteUrl = Env.get("SITE_URL", "https://shop.ncwu.site").replaceAll("/+$", "");
    /** Store owner inbox that receives every contact-form submission and refund alert. */
    private final String adminInbox = Env.get("ADMIN_EMAIL", "md.milton@qq.com");

    private final MailTemplates templates = new MailTemplates(siteUrl, fromAddress(from));

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public String siteUrl() {
        return siteUrl;
    }

    /* ---------------- Public triggers ---------------- */

    public void sendWelcome(User user) {
        MailTemplates.Mail mail = templates.welcome(user);
        send(user.email, "Welcome to NCWU StyleHub", mail.html(), mail.text(), null);
    }

    public void sendOrderConfirmation(User user, Order order) {
        sendOrderConfirmation(user.email, order);
    }

    /** Guest checkout: the confirmation goes to the email typed at checkout. */
    public void sendOrderConfirmation(String email, Order order) {
        MailTemplates.Mail mail = templates.orderConfirmation(order);
        send(email, "Order #" + order.id + " confirmed | NCWU StyleHub", mail.html(), mail.text(), null);
    }

    public void sendTrackingUpdate(User user, Order order) {
        sendTrackingUpdate(user.email, order);
    }

    public void sendTrackingUpdate(String email, Order order) {
        MailTemplates.Mail mail = templates.trackingUpdate(order);
        send(email, "Order #" + order.id + " update | NCWU StyleHub", mail.html(), mail.text(), null);
    }

    public void sendPasswordReset(User user, String rawToken) {
        MailTemplates.Mail mail = templates.passwordReset(user, rawToken);
        send(user.email, "Reset your NCWU StyleHub password", mail.html(), mail.text(), null);
    }

    /** Confirmation for a customer who cancels their own order. */
    public void sendOrderCancelled(User user, Order order) {
        MailTemplates.Mail mail = templates.orderCancelled(order);
        send(user.email, "Order #" + order.id + " cancelled | NCWU StyleHub", mail.html(), mail.text(), null);
    }

    public void sendOrderCancelled(String email, Order order) {
        MailTemplates.Mail mail = templates.orderCancelled(order);
        send(email, "Order #" + order.id + " cancelled | NCWU StyleHub", mail.html(), mail.text(), null);
    }

    public void sendRefundRequested(RefundRequest refund) {
        MailTemplates.Mail mail = templates.refundRequested(refund);
        send(adminInbox, "Refund request for order #" + refund.order.id, mail.html(), mail.text(), refund.user.email);
    }

    public void sendRefundDecision(RefundRequest refund) {
        MailTemplates.Mail mail = templates.refundDecision(refund);
        send(refund.user.email, "Refund " + refund.status + " for order #" + refund.order.id,
                mail.html(), mail.text(), null);
    }

    /** Welcome note for a new NCWU StyleHub Club member. */
    public void sendClubWelcome(String email) {
        MailTemplates.Mail mail = templates.clubWelcome(email);
        send(email, "Welcome to the NCWU StyleHub Club", mail.html(), mail.text(), null);
    }

    /** Contact-form submission forwarded to the store owner, with the sender set as reply-to. */
    public void sendContactMessage(String name, String email, String subject, String message) {
        MailTemplates.Mail mail = templates.contactMessage(name, email, subject, message);
        send(adminInbox, subject == null || subject.isBlank()
                ? "Contact form: " + name
                : "[Contact] " + subject, mail.html(), mail.text(), email);
    }

    /* ---------------- Transport ---------------- */

    public void send(String to, String subject, String html) {
        send(to, subject, html, null, null);
    }

    public void send(String to, String subject, String html, String replyTo) {
        send(to, subject, html, null, replyTo);
    }

    public void send(String to, String subject, String html, String text, String replyTo) {
        if (to == null || to.isBlank()) {
            log.warn("Skipping email '{}' because no recipient address was given.", subject);
            return;
        }
        if (!isEnabled()) {
            log.warn("RESEND_API_KEY is not set - skipping email '{}' to {}.", subject, to);
            return;
        }
        // Fire-and-forget so checkout/signup latency is untouched.
        Thread worker = new Thread(() -> post(to, subject, html, text, replyTo), "mail-send");
        worker.setDaemon(true);
        worker.start();
    }

    private void post(String to, String subject, String html, String text, String replyTo) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", from);
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            payload.put("html", html);
            if (text != null && !text.isBlank()) {
                payload.put("text", text);
            }
            if (replyTo != null && !replyTo.isBlank()) {
                payload.put("reply_to", replyTo);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ENDPOINT))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                log.error("Resend rejected email to {} ({}): {}", to, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    /** Extracts a usable address from a "Name &lt;address&gt;" sender value. */
    static String fromAddress(String sender) {
        if (sender == null || sender.isBlank()) {
            return "info@shop.ncwu.site";
        }
        int open = sender.indexOf('<');
        int close = sender.indexOf('>', open + 1);
        if (open >= 0 && close > open) {
            return sender.substring(open + 1, close).trim();
        }
        return sender.trim();
    }
}
