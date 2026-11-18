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

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.OrderItem;
import com.ncwu.stylehub.domain.User;

/**
 * Transactional email through Resend (https://resend.com).
 *
 * The API key lives only in this process (env var RESEND_API_KEY) and is never sent to the browser.
 * Sending is fire-and-forget: a mail failure must never break checkout or signup.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);
    private static final String ENDPOINT = "https://api.resend.com/emails";

    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String apiKey = env("RESEND_API_KEY", "");
    private final String from = env("MAIL_FROM", "NCWU StyleHub <info@shop.ncwu.site>");
    private final String siteUrl = env("SITE_URL", "https://shop.ncwu.site");
    /** Store owner inbox that receives every contact-form submission. */
    private final String adminInbox = env("ADMIN_EMAIL", "miltonbabu9666@gmail.com");

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public String siteUrl() {
        return siteUrl;
    }

    /* ---------------- Public triggers ---------------- */

    public void sendWelcome(User user) {
        String html = layout(
                "Welcome to NCWU StyleHub",
                "<p>Hi " + escape(user.name) + ",</p>"
                        + "<p>Your account is ready. You can now shop new arrivals, save favourites and track every "
                        + "order from your account page.</p>"
                        + button("Start shopping", siteUrl + "/shop")
                        + "<p class=\"muted\">Your sign-in email is <strong>" + escape(user.email) + "</strong>.</p>");
        send(user.email, "Welcome to NCWU StyleHub", html);
    }

    public void sendOrderConfirmation(User user, Order order) {
        String html = layout(
                "Order #" + order.id + " confirmed",
                "<p>Hi " + escape(user.name) + ",</p>"
                        + "<p>Thanks for your order. We have received it and will let you know as soon as it ships.</p>"
                        + orderTable(order)
                        + (order.trackingNumber != null && !order.trackingNumber.isBlank()
                                ? "<p>Tracking code: <strong>" + escape(order.trackingNumber) + "</strong></p>"
                                : "")
                        + button("Track your order", siteUrl + "/orders/" + order.id));
        send(user.email, "Order #" + order.id + " confirmed — NCWU StyleHub", html);
    }

    public void sendTrackingUpdate(User user, Order order) {
        String html = layout(
                "Order #" + order.id + " is " + order.status,
                "<p>Hi " + escape(user.name) + ",</p>"
                        + "<p>Your order status changed to <strong>" + escape(order.status) + "</strong>.</p>"
                        + (order.trackingNumber != null && !order.trackingNumber.isBlank()
                                ? "<p>Tracking code: <strong>" + escape(order.trackingNumber) + "</strong></p>"
                                : "")
                        + orderTable(order)
                        + button("View order", siteUrl + "/orders/" + order.id));
        send(user.email, "Update on order #" + order.id + " — NCWU StyleHub", html);
    }

    public void sendPasswordReset(User user, String rawToken) {
        String link = siteUrl + "/auth/reset-password?token=" + rawToken;
        String html = layout(
                "Reset your password",
                "<p>Hi " + escape(user.name) + ",</p>"
                        + "<p>We received a request to reset the password for <strong>" + escape(user.email)
                        + "</strong>. This link expires in 60 minutes.</p>"
                        + button("Choose a new password", link)
                        + "<p class=\"muted\">If you did not request this, you can safely ignore this email — your "
                        + "password will not change.</p>");
        send(user.email, "Reset your NCWU StyleHub password", html);
    }

    /** Confirmation for a customer who cancels their own order. */
    public void sendOrderCancelled(User user, Order order) {
        String html = layout(
                "Order #" + order.id + " cancelled",
                "<p>Hi " + escape(user.name) + ",</p>"
                        + "<p>Your order has been cancelled as requested. Any reserved stock has been released.</p>"
                        + orderTable(order)
                        + "<p>Changed your mind? You can always order again from the shop.</p>"
                        + button("Back to the shop", siteUrl + "/shop"));
        send(user.email, "Order #" + order.id + " cancelled — NCWU StyleHub", html);
    }

    /** Welcome note for a new NCWU StyleHub Club member. */
    public void sendClubWelcome(String email) {
        String html = layout(
                "You're in the NCWU StyleHub Club",
                "<p>Hi there,</p>"
                        + "<p>Thanks for joining the club with <strong>" + escape(email) + "</strong>. "
                        + "You will be the first to hear about new drops, member-only offers and early access "
                        + "to seasonal sales.</p>"
                        + "<p>As a welcome gift, use code <strong>CLUB10</strong> for 10% off your first order.</p>"
                        + button("Shop new arrivals", siteUrl + "/shop?sort=newest")
                        + "<p class=\"muted\">You are receiving this because you subscribed at " + escape(siteUrl)
                        + ". Reply to this email if you would like to be removed.</p>");
        send(email, "Welcome to the NCWU StyleHub Club", html);
    }

    /* ---------------- Transport ---------------- */

    /** Contact-form submission forwarded to the store owner, with the sender set as reply-to. */
    public void sendContactMessage(String name, String email, String subject, String message) {
        String heading = "New contact message";
        String html = layout(
                heading,
                "<p><strong>" + escape(name) + "</strong> &lt;" + escape(email) + "&gt;</p>"
                        + (subject == null || subject.isBlank() ? "" : "<p><strong>Subject:</strong> " + escape(subject) + "</p>")
                        + "<p style=\"white-space:pre-line;border-left:3px solid #6d28d9;padding-left:12px;\">"
                        + escape(message) + "</p>"
                        + "<p class=\"muted\" style=\"font-size:12px;color:#8b8b96;\">Reply to this email to answer "
                        + escape(name) + " directly.</p>");
        send(adminInbox, subject == null || subject.isBlank()
                ? "Contact form: " + name
                : "[Contact] " + subject, html, email);
    }

    public void send(String to, String subject, String html) {
        send(to, subject, html, null);
    }

    public void send(String to, String subject, String html, String replyTo) {
        if (!isEnabled()) {
            log.warn("RESEND_API_KEY is not set — skipping email '{}' to {}.", subject, to);
            return;
        }
        // Fire-and-forget so checkout/signup latency is untouched.
        Thread worker = new Thread(() -> post(to, subject, html, replyTo), "mail-send");
        worker.setDaemon(true);
        worker.start();
    }

    private void post(String to, String subject, String html, String replyTo) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", from);
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            payload.put("html", html);
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

    /* ---------------- Templates ---------------- */

    private String orderTable(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.items) {
            rows.append("<tr><td style=\"padding:8px 0;border-bottom:1px solid #eee;\">")
                    .append(escape(item.productName))
                    .append(item.size != null && !item.size.isBlank() ? " <span class=\"muted\">(Size " + escape(item.size) + ")</span>" : "")
                    .append(" &times; ").append(item.quantity)
                    .append("</td><td align=\"right\" style=\"padding:8px 0;border-bottom:1px solid #eee;\">¥")
                    .append(String.format("%.2f", item.unitPrice * item.quantity))
                    .append("</td></tr>");
        }
        return "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:16px 0;font-size:14px;\">"
                + rows
                + "<tr><td style=\"padding:12px 0;\"><strong>Total</strong></td>"
                + "<td align=\"right\" style=\"padding:12px 0;\"><strong>¥"
                + String.format("%.2f", order.total) + "</strong></td></tr></table>";
    }

    private String button(String label, String href) {
        return "<p style=\"margin:24px 0;\"><a href=\"" + href + "\" style=\"background:#6d28d9;color:#fff;"
                + "text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;display:inline-block;\">"
                + escape(label) + "</a></p>";
    }

    private String layout(String heading, String body) {
        return "<div style=\"font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1e1b4b;max-width:560px;margin:0 auto;\">"
                + "<h1 style=\"font-size:22px;margin:0 0 16px;\">" + escape(heading) + "</h1>"
                + body
                + "<hr style=\"border:none;border-top:1px solid #eee;margin:28px 0;\" />"
                + "<p class=\"muted\" style=\"font-size:12px;color:#8b8b96;\">NCWU StyleHub · NCWU Business Street, "
                + "F1 2nd Floor · <a href=\"" + siteUrl + "\" style=\"color:#6d28d9;\">shop.ncwu.site</a></p>"
                + "</div>";
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}
