package com.ncwu.stylehub.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.OrderItem;
import com.ncwu.stylehub.domain.RefundRequest;
import com.ncwu.stylehub.domain.User;

/**
 * HTML and plain-text rendering for every transactional email.
 *
 * <p>Design rules: table layout, inline styles only, 600 px card, brand gradient header, one clear
 * call to action per message, product images in order summaries, and a footer with working links.
 * Every message ships a text alternative and every link points at a route that exists on the
 * storefront (/shop, /product/{slug}, /orders/{id}, /account, /help/contact, /auth/reset-password,
 * /admin/refunds).
 */
final class MailTemplates {

    /** Rendered pair: rich HTML plus the plain-text fallback Resend delivers alongside it. */
    record Mail(String html, String text) {
    }

    private static final String BRAND = "#6d28d9";
    private static final String BRAND_DEEP = "#4c1d95";
    private static final String ACCENT = "#06b6d4";
    private static final String INK = "#191634";
    private static final String TEXT = "#45415c";
    private static final String MUTED = "#6f6b85";
    private static final String BORDER = "#e9e5f6";
    private static final String SOFT = "#f7f5ff";
    private static final String PAGE = "#f3f0fb";
    private static final String P = "margin:0 0 14px;font-size:15px;line-height:1.65;color:" + TEXT + ";";
    private static final String H2 = "margin:22px 0 10px;font-size:12px;letter-spacing:1.6px;"
            + "text-transform:uppercase;color:" + MUTED + ";font-weight:700;";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm", Locale.ENGLISH);

    private final String siteUrl;
    private final String supportEmail;

    MailTemplates(String siteUrl, String supportEmail) {
        this.siteUrl = siteUrl == null ? "" : siteUrl.replaceAll("/+$", "");
        this.supportEmail = supportEmail == null || supportEmail.isBlank() ? "info@shop.ncwu.site" : supportEmail;
    }

    /* ---------------- Messages ---------------- */

    Mail welcome(User user) {
        String shop = siteUrl + "/shop";
        String arrivals = shop + "?sort=newest";
        String html = layout("Welcome aboard", "Welcome to NCWU StyleHub",
                "<p style=\"" + P + "\">Hi " + escape(user.name) + ",</p>"
                        + "<p style=\"" + P + "\">Your account is ready. Browse the latest drops, save the pieces "
                        + "you love and follow every order from one place.</p>"
                        + card(featureRow("New arrivals every week", "Fresh styles land in the shop regularly.")
                                + featureRow("Saved favourites", "Your wishlist follows you across devices.")
                                + featureRow("Order tracking", "See status and tracking codes at any time."))
                        + button("Start shopping", shop)
                        + secondary(arrivals, "or browse new arrivals")
                        + note("You signed up with <strong>" + escape(user.email) + "</strong>. "
                                + "Manage your details in <a href=\"" + escape(siteUrl + "/account")
                                + "\" style=\"color:" + BRAND + ";text-decoration:underline;\">your account</a>."));
        String text = plain(
                "Welcome to NCWU StyleHub",
                "Hi " + user.name + ",",
                "Your account is ready. Browse new arrivals, save favourites and track every order from one place.",
                "Start shopping: " + shop,
                "New arrivals: " + arrivals,
                "Your account: " + siteUrl + "/account",
                "Signed up with: " + user.email);
        return new Mail(html, text);
    }

    Mail orderConfirmation(Order order) {
        String view = siteUrl + "/orders/" + order.id;
        String html = layout("Order confirmed", "Order #" + order.id + " is confirmed",
                "<p style=\"" + P + "\">Hi " + escape(order.user.name) + ",</p>"
                        + "<p style=\"" + P + "\">Thanks for your order. We have received it and will email you "
                        + "again as soon as it ships.</p>"
                        + orderSummary(order)
                        + itemsTable(order)
                        + card(shippingCard(order))
                        + trackingBox(order)
                        + button("View order details", view)
                        + secondary(siteUrl + "/shop", "or continue shopping"));
        return new Mail(html, plain("Order #" + order.id + " confirmed",
                "Hi " + order.user.name + ",",
                "Thanks for your order. We have received it and will email you again as soon as it ships.",
                orderText(order),
                "Total: " + money(order.total),
                "View order details: " + view));
    }

    Mail trackingUpdate(Order order) {
        String view = siteUrl + "/orders/" + order.id;
        String html = layout("Order update", statusHeading(order),
                "<p style=\"" + P + "\">Hi " + escape(order.user.name) + ",</p>"
                        + "<p style=\"" + P + "\">" + escape(statusMessage(order.status)) + "</p>"
                        + ("cancelled".equals(order.status) ? "" : timeline(order.status))
                        + orderSummary(order)
                        + trackingBox(order)
                        + button("Track your order", view)
                        + secondary(siteUrl + "/shop?sort=newest", "or shop new arrivals"));
        return new Mail(html, plain(statusHeading(order),
                "Hi " + order.user.name + ",",
                statusMessage(order.status),
                "Order: #" + order.id,
                "Status: " + order.status,
                order.trackingNumber == null || order.trackingNumber.isBlank() ? "" : "Tracking: " + order.trackingNumber,
                "Track your order: " + view));
    }

    Mail passwordReset(User user, String rawToken) {
        String link = siteUrl + "/auth/reset-password?token=" + rawToken;
        String html = layout("Account security", "Reset your password",
                "<p style=\"" + P + "\">Hi " + escape(user.name) + ",</p>"
                        + "<p style=\"" + P + "\">We received a request to reset the password for "
                        + "<strong>" + escape(user.email) + "</strong>. Choose a new password with the button below.</p>"
                        + button("Choose a new password", link)
                        + linkFallback(link)
                        + note("<strong>This link expires in 60 minutes</strong> and can only be used once. "
                        + "If you did not request a reset, you can ignore this email and your password will stay the same."));
        return new Mail(html, plain("Reset your NCWU StyleHub password",
                "Hi " + user.name + ",",
                "We received a request to reset the password for " + user.email + ".",
                "Choose a new password (expires in 60 minutes, single use): " + link,
                "If you did not request this, you can ignore this email."));
    }

    Mail orderCancelled(Order order) {
        String view = siteUrl + "/orders/" + order.id;
        String shop = siteUrl + "/shop";
        String html = layout("Order cancelled", "Order #" + order.id + " has been cancelled",
                "<p style=\"" + P + "\">Hi " + escape(order.user.name) + ",</p>"
                        + "<p style=\"" + P + "\">Your order has been cancelled as requested. Any reserved stock "
                        + "has been released back to the shop.</p>"
                        + orderSummary(order)
                        + itemsTable(order)
                        + button("Start a new order", shop)
                        + secondary(view, "or view the cancelled order")
                        + note("If your payment was already captured, our team will refund it to your original "
                        + "payment method. Questions? <a href=\"" + escape(siteUrl + "/help/contact")
                        + "\" style=\"color:" + BRAND + ";text-decoration:underline;\">Contact support</a>."));
        return new Mail(html, plain("Order #" + order.id + " cancelled",
                "Hi " + order.user.name + ",",
                "Your order has been cancelled as requested and any reserved stock has been released.",
                orderText(order),
                "Start a new order: " + shop,
                "View the cancelled order: " + view));
    }

    Mail refundRequested(RefundRequest refund) {
        String admin = siteUrl + "/admin/refunds";
        String reply = "mailto:" + refund.user.email + "?subject="
                + encode("Re: refund for order #" + refund.order.id);
        String html = layout("Action needed", "New refund request for order #" + refund.order.id,
                "<p style=\"" + P + "\">A customer has requested a refund for an order that has already shipped. "
                        + "Review the request, then reply with your decision.</p>"
                        + details(
                                "Customer", escape(refund.user.name),
                                "Email", escape(refund.user.email),
                                "Item", escape(refund.orderItem.productName),
                                "Quantity", String.valueOf(refund.quantity),
                                "Refund value", money(refund.orderItem.unitPrice * refund.quantity),
                                "Status", pill(refund.status))
                        + "<div style=\"" + H2 + "\">Reason</div>"
                        + "<div style=\"padding:14px 16px;background:#ffffff;border-left:3px solid " + BRAND
                        + ";border-radius:0 10px 10px 0;font-size:14px;line-height:1.65;color:" + TEXT
                        + ";white-space:pre-line;\">" + escape(refund.reason) + "</div>"
                        + button("Open refund requests", admin)
                        + secondary(reply, "or reply to " + refund.user.name)
                        + note("Requested " + escape(date(refund.requestedAt)) + "."),
                null, true);
        return new Mail(html, plain("New refund request for order #" + refund.order.id,
                "Customer: " + refund.user.name + " <" + refund.user.email + ">",
                "Item: " + refund.orderItem.productName + " x" + refund.quantity,
                "Refund value: " + plainMoney(refund.orderItem.unitPrice * refund.quantity),
                "Reason: " + refund.reason,
                "Open refund requests: " + admin,
                "Reply to the customer: " + refund.user.email));
    }

    Mail refundDecision(RefundRequest refund) {
        boolean approved = "approved".equals(refund.status);
        String view = siteUrl + "/orders/" + refund.order.id;
        String html = layout("Refund update",
                approved ? "Your refund was approved" : "Your refund request was reviewed",
                "<p style=\"" + P + "\">Hi " + escape(refund.user.name) + ",</p>"
                        + "<p style=\"" + P + "\">We have reviewed your refund request for <strong>"
                        + escape(refund.orderItem.productName) + "</strong> from order <strong>#"
                        + refund.order.id + "</strong>.</p>"
                        + details(
                                "Status", pill(refund.status),
                                "Item", escape(refund.orderItem.productName),
                                "Quantity", String.valueOf(refund.quantity),
                                "Refund value", money(refund.orderItem.unitPrice * refund.quantity))
                        + (approved
                                ? "<p style=\"" + P + "\">The refund has been approved. Our team will process it "
                                + "shortly; how long it takes to appear depends on your payment provider.</p>"
                                : "<p style=\"" + P + "\">Unfortunately this request was not approved. If you have "
                                + "questions about the decision, reply to this email and our team will help.</p>")
                        + (refund.adminNote == null || refund.adminNote.isBlank()
                                ? ""
                                : note("<strong>Note from our team:</strong> " + escape(refund.adminNote)))
                        + button("View order", view)
                        + secondary(siteUrl + "/help/contact", "or contact support"));
        return new Mail(html, plain(approved ? "Your refund was approved" : "Your refund request was reviewed",
                "Hi " + refund.user.name + ",",
                "Item: " + refund.orderItem.productName,
                "Order: #" + refund.order.id,
                "Status: " + refund.status,
                "Refund value: " + plainMoney(refund.orderItem.unitPrice * refund.quantity),
                approved ? "Our team will process the refund shortly." : "If you have questions, reply to this email.",
                refund.adminNote == null || refund.adminNote.isBlank() ? "" : "Note: " + refund.adminNote,
                "View order: " + view));
    }

    Mail clubWelcome(String email) {
        String arrivals = siteUrl + "/shop?sort=newest";
        String unsubscribe = "mailto:" + supportEmail + "?subject=" + encode("Unsubscribe from the club");
        String html = layout("Club member", "You're in. Welcome to the club.",
                "<p style=\"" + P + "\">Hi there,</p>"
                        + "<p style=\"" + P + "\">Thanks for joining the NCWU StyleHub Club with <strong>"
                        + escape(email) + "</strong>. You will be the first to hear about new drops, member-only "
                        + "offers and early access to seasonal sales.</p>"
                        + promoCard()
                        + button("Shop new arrivals", arrivals)
                        + secondary(siteUrl + "/shop", "or browse the full collection"),
                "<div style=\"margin-top:14px;font-size:12px;line-height:1.6;color:" + MUTED + ";\">"
                        + "You are receiving this because you joined the NCWU StyleHub Club at "
                        + escape(siteUrl) + ". <a href=\"" + escape(unsubscribe) + "\" style=\"color:" + BRAND
                        + ";text-decoration:underline;\">Unsubscribe</a></div>");
        return new Mail(html, plain("Welcome to the NCWU StyleHub Club",
                "Thanks for joining with " + email + ".",
                "You will be the first to hear about new drops, member-only offers and early access to seasonal sales.",
                "Welcome gift: use code CLUB10 for 10% off your first order.",
                "Shop new arrivals: " + arrivals,
                "Unsubscribe: " + unsubscribe));
    }

    Mail contactMessage(String name, String email, String subject, String message) {
        String topic = subject == null || subject.isBlank() ? "Your message to NCWU StyleHub" : subject;
        String reply = "mailto:" + email + "?subject=" + encode("Re: " + topic);
        String html = layout("Contact form", "New message from " + name,
                "<p style=\"" + P + "\">A new message arrived through the contact form on the storefront.</p>"
                        + details(
                                "Name", escape(name),
                                "Email", escape(email),
                                "Subject", subject == null || subject.isBlank() ? "No subject" : escape(subject))
                        + "<div style=\"" + H2 + "\">Message</div>"
                        + "<div style=\"padding:14px 16px;background:#ffffff;border-left:3px solid " + BRAND
                        + ";border-radius:0 10px 10px 0;font-size:14px;line-height:1.65;color:" + TEXT
                        + ";white-space:pre-line;\">" + escape(message) + "</div>"
                        + button("Reply to " + name, reply)
                        + secondary(siteUrl + "/admin", "or open the admin panel")
                        + note("Sent from the contact form at " + escape(siteUrl + "/help/contact") + "."),
                null, true);
        return new Mail(html, plain("New contact message",
                "Name: " + name,
                "Email: " + email,
                "Subject: " + (subject == null || subject.isBlank() ? "No subject" : subject),
                message,
                "Reply: " + reply));
    }

    private String promoCard() {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 20px;background:" + SOFT + ";border:1px dashed " + BRAND
                + ";border-radius:14px;\"><tr><td align=\"center\" style=\"padding:22px 18px;\">"
                + "<div style=\"font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:" + MUTED
                + ";font-weight:700;\">Welcome gift</div>"
                + "<div style=\"margin:8px 0 6px;font-size:26px;font-weight:700;letter-spacing:5px;color:" + BRAND
                + ";\">CLUB10</div>"
                + "<div style=\"font-size:13px;color:" + TEXT + ";\">10% off your first order</div>"
                + "</td></tr></table>";
    }

    /* ---------------- Layout ---------------- */

    private String layout(String kicker, String heading, String body) {
        return layout(kicker, heading, body, null, false);
    }

    private String layout(String kicker, String heading, String body, String footerNote) {
        return layout(kicker, heading, body, footerNote, false);
    }

    /** {@code admin} swaps the customer footer links for links to the admin panel. */
    private String layout(String kicker, String heading, String body, String footerNote, boolean admin) {
        String home = siteUrl;
        return "<!doctype html><html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">"
                + "<head><meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<meta name=\"x-apple-disable-message-reformatting\">"
                + "<meta name=\"color-scheme\" content=\"light only\">"
                + "<meta name=\"supported-color-schemes\" content=\"light only\">"
                + "<title>" + escape(heading) + "</title>"
                + "<style>"
                + "body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}"
                + "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}"
                + "img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}"
                + "@media only screen and (max-width:620px){"
                + ".wrap{width:100%!important;max-width:100%!important;}"
                + ".px{padding-left:22px!important;padding-right:22px!important;}"
                + ".h1{font-size:24px!important;line-height:1.3!important;}"
                + ".hide{display:none!important;mso-hide:all!important;}"
                + "}"
                + "</style></head>"
                + "<body style=\"margin:0;padding:0;background:" + PAGE + ";"
                + "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:" + INK + ";\">"
                + preheader(heading)
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"background:" + PAGE + ";\"><tr><td align=\"center\" style=\"padding:28px 12px;\">"
                + "<table role=\"presentation\" class=\"wrap\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" "
                + "border=\"0\" style=\"width:600px;max-width:600px;background:#ffffff;border-radius:18px;"
                + "overflow:hidden;box-shadow:0 14px 34px rgba(25,22,52,.09);\">"
                + "<tr><td bgcolor=\"" + BRAND + "\" style=\"background:" + BRAND + ";background-image:linear-gradient(135deg,"
                + BRAND_DEEP + " 0%," + BRAND + " 52%," + ACCENT + " 100%);padding:24px 32px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>"
                + "<td width=\"46\" style=\"width:46px;vertical-align:middle;\">"
                + "<a href=\"" + escape(home) + "\" style=\"text-decoration:none;\">"
                + "<div style=\"width:46px;height:46px;border-radius:13px;background:#ffffff;color:" + BRAND
                + ";font-size:23px;font-weight:800;line-height:46px;text-align:center;letter-spacing:-1px;\">S</div>"
                + "</a></td>"
                + "<td style=\"padding-left:12px;vertical-align:middle;\">"
                + "<a href=\"" + escape(home) + "\" style=\"text-decoration:none;color:#ffffff;font-size:19px;"
                + "font-weight:700;letter-spacing:-.2px;\">NCWU StyleHub<span style=\"color:" + ACCENT + ";\">.</span></a>"
                + "<div style=\"margin-top:3px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;"
                + "color:rgba(255,255,255,.78);\">Everyday style, considered</div></td>"
                + "<td class=\"hide\" align=\"right\" style=\"vertical-align:middle;\">"
                + "<a href=\"" + escape(home) + "/shop\" style=\"display:inline-block;padding:8px 15px;border:1px solid "
                + "rgba(255,255,255,.5);border-radius:999px;color:#ffffff;font-size:12px;font-weight:600;"
                + "text-decoration:none;\">Shop</a></td>"
                + "</tr></table></td></tr>"
                + "<tr><td class=\"px\" style=\"padding:36px 36px 10px;\">"
                + "<div style=\"margin-bottom:10px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;"
                + "color:" + BRAND + ";font-weight:700;\">" + escape(kicker) + "</div>"
                + "<h1 class=\"h1\" style=\"margin:0 0 18px;font-size:28px;line-height:1.25;letter-spacing:-.6px;"
                + "color:" + INK + ";font-weight:700;\">" + escape(heading) + "</h1>"
                + body
                + "</td></tr>"
                + footer(footerNote, admin)
                + "</table></td></tr></table></body></html>";
    }

    private String preheader(String heading) {
        return "<div style=\"display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;"
                + "overflow:hidden;color:" + PAGE + ";\">" + escape(heading) + " | NCWU StyleHub"
                + "&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>";
    }

    private String footer(String note, boolean admin) {
        String extra = note == null || note.isBlank() ? "" : note;
        String links = admin
                ? nav("Admin panel", siteUrl + "/admin") + sep()
                        + nav("Refund requests", siteUrl + "/admin/refunds") + sep()
                        + nav("Storefront", siteUrl) + sep()
                        + nav("Contact us", siteUrl + "/help/contact")
                : nav("Shop", siteUrl + "/shop") + sep()
                        + nav("New arrivals", siteUrl + "/shop?sort=newest") + sep()
                        + nav("My orders", siteUrl + "/orders") + sep()
                        + nav("Contact us", siteUrl + "/help/contact");
        return "<tr><td class=\"px\" style=\"padding:6px 36px 34px;\">"
                + "<div style=\"border-top:1px solid " + BORDER + ";padding-top:22px;text-align:center;\">"
                + "<p style=\"margin:0 0 4px;font-size:14px;font-weight:700;color:" + INK + ";\">NCWU StyleHub</p>"
                + "<p style=\"margin:0 0 14px;font-size:12px;color:" + MUTED + ";\">Everyday style, considered.</p>"
                + "<p style=\"margin:0 0 14px;font-size:13px;line-height:1.9;\">" + links + "</p>"
                + "<p style=\"margin:0;font-size:11px;line-height:1.7;color:#9b97ad;\">"
                + "NCWU Business Street, F1 2nd Floor, Zhengzhou, Henan, China<br>"
                + "&copy; " + Year.now().getValue() + " NCWU StyleHub. All rights reserved.</p>"
                + extra
                + "</div></td></tr>";
    }

    /* ---------------- Blocks ---------------- */

    private String button(String label, String href) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:26px 0 12px;\"><tr>"
                + "<td align=\"center\" bgcolor=\"" + BRAND + "\" style=\"background:" + BRAND + ";"
                + "background-image:linear-gradient(135deg," + BRAND + " 0%," + BRAND_DEEP + " 100%);"
                + "border-radius:999px;\">"
                + "<a href=\"" + escape(href) + "\" style=\"display:inline-block;padding:14px 32px;font-size:15px;"
                + "font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;\">"
                + escape(label) + "</a></td></tr></table>";
    }

    private String secondary(String href, String label) {
        return "<p style=\"margin:0 0 8px;font-size:13px;\">"
                + "<a href=\"" + escape(href) + "\" style=\"color:" + BRAND + ";font-weight:600;"
                + "text-decoration:none;\">" + escape(label) + " &rarr;</a></p>";
    }

    private String linkFallback(String href) {
        return "<p style=\"margin:0 0 8px;font-size:12px;line-height:1.6;color:" + MUTED + ";word-break:break-all;\">"
                + "Button not working? Copy this link: "
                + "<a href=\"" + escape(href) + "\" style=\"color:" + BRAND + ";text-decoration:underline;\">"
                + escape(href) + "</a></p>";
    }

    private String note(String html) {
        return "<div style=\"margin:18px 0 0;padding:14px 16px;background:" + SOFT + ";border:1px solid " + BORDER
                + ";border-radius:12px;font-size:12px;line-height:1.65;color:" + MUTED + ";\">" + html + "</div>";
    }

    private String card(String inner) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 20px;background:" + SOFT + ";border:1px solid " + BORDER
                + ";border-radius:14px;\"><tr><td style=\"padding:18px 20px;\">" + inner + "</td></tr></table>";
    }

    private String details(String... labelValuePairs) {
        StringBuilder rows = new StringBuilder();
        for (int i = 0; i + 1 < labelValuePairs.length; i += 2) {
            rows.append("<tr><td style=\"padding:6px 0;font-size:13px;color:" + MUTED + ";\">")
                    .append(escape(labelValuePairs[i])).append("</td>")
                    .append("<td align=\"right\" style=\"padding:6px 0;font-size:13px;font-weight:600;color:")
                    .append(INK).append(";\">").append(labelValuePairs[i + 1]).append("</td></tr>");
        }
        return card("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                + rows + "</table>");
    }

    private String featureRow(String title, String description) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 12px;\"><tr>"
                + "<td width=\"22\" style=\"width:22px;vertical-align:top;padding-top:5px;\">"
                + "<div style=\"width:9px;height:9px;border-radius:3px;background:" + BRAND + ";\"></div></td>"
                + "<td style=\"font-size:13px;line-height:1.6;color:" + MUTED + ";\">"
                + "<strong style=\"color:" + INK + ";\">" + escape(title) + "</strong><br>"
                + escape(description) + "</td></tr></table>";
    }

    private String orderSummary(Order order) {
        return details(
                "Order number", "#" + order.id,
                "Status", pill(order.status),
                "Placed", escape(date(order.createdAt)),
                "Payment", escape(payment(order.paymentMethod)),
                "Order total", "<span style=\"font-size:15px;\">" + money(order.total) + "</span>");
    }

    private String itemsTable(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.items) {
            rows.append(itemRow(item));
        }
        String total = "<tr><td colspan=\"2\" style=\"padding:14px 0 0;border-top:1px solid " + BORDER
                + ";font-size:14px;font-weight:700;color:" + INK + ";\">Total</td>"
                + "<td align=\"right\" style=\"padding:14px 0 0;border-top:1px solid " + BORDER
                + ";font-size:16px;font-weight:700;color:" + INK + ";white-space:nowrap;\">"
                + money(order.total) + "</td></tr>";
        return "<div style=\"" + H2 + "\">Your items</div>"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 22px;\">" + rows + total + "</table>";
    }

    private String itemRow(OrderItem item) {
        String name = escape(item.productName);
        if (item.product != null && item.product.slug != null && !item.product.slug.isBlank()) {
            name = "<a href=\"" + escape(siteUrl + "/product/" + item.product.slug) + "\" style=\"color:" + INK
                    + ";text-decoration:none;\">" + name + "</a>";
        }
        StringBuilder meta = new StringBuilder();
        if (item.style != null && !item.style.isBlank()) {
            meta.append("Style: ").append(escape(item.style));
        }
        if (item.size != null && !item.size.isBlank()) {
            meta.append(meta.length() > 0 ? " &middot; " : "").append("Size: ").append(escape(item.size));
        }
        meta.append(meta.length() > 0 ? " &middot; " : "").append("Qty: ").append(item.quantity);

        String thumb = "<div style=\"width:56px;height:70px;border-radius:10px;background:#ffffff;"
                + "border:1px solid " + BORDER + ";\"></div>";
        if (item.product != null && item.product.imageUrl != null && !item.product.imageUrl.isBlank()) {
            thumb = "<img src=\"" + escape(item.product.imageUrl) + "\" width=\"56\" height=\"70\" alt=\""
                    + escape(item.productName) + "\" style=\"display:block;width:56px;height:70px;border-radius:10px;"
                    + "object-fit:cover;background:" + SOFT + ";\">";
        }
        return "<tr>"
                + "<td width=\"68\" style=\"width:68px;padding:12px 0;vertical-align:top;\">" + thumb + "</td>"
                + "<td style=\"padding:12px 8px 12px 12px;vertical-align:top;\">"
                + "<div style=\"font-size:14px;font-weight:600;line-height:1.45;color:" + INK + ";\">" + name + "</div>"
                + "<div style=\"margin-top:4px;font-size:12px;color:" + MUTED + ";\">" + meta + "</div></td>"
                + "<td align=\"right\" style=\"padding:12px 0;vertical-align:top;font-size:14px;font-weight:600;"
                + "color:" + INK + ";white-space:nowrap;\">" + money(item.unitPrice * item.quantity) + "</td></tr>";
    }

    private String shippingCard(Order order) {
        String phone = order.shippingPhone == null || order.shippingPhone.isBlank() ? ""
                : "<div style=\"margin-top:3px;font-size:13px;color:" + MUTED + ";\">" + escape(order.shippingPhone)
                        + "</div>";
        return "<div style=\"" + H2 + "\">Shipping to</div>"
                + "<div style=\"font-size:14px;font-weight:600;color:" + INK + ";\">" + escape(order.shippingName)
                + "</div>"
                + "<div style=\"margin-top:3px;font-size:13px;line-height:1.6;color:" + MUTED
                + ";white-space:pre-line;\">" + escape(order.shippingAddress) + "</div>"
                + phone;
    }

    private String trackingBox(Order order) {
        if (order.trackingNumber == null || order.trackingNumber.isBlank()) {
            return "";
        }
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 20px;background:" + INK + ";border-radius:14px;\"><tr>"
                + "<td style=\"padding:16px 20px;\">"
                + "<div style=\"font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#b6b0d6;\">"
                + "Tracking number</div>"
                + "<div style=\"margin-top:5px;font-size:18px;font-weight:700;letter-spacing:1.5px;color:#ffffff;\">"
                + escape(order.trackingNumber) + "</div></td></tr></table>";
    }

    private String timeline(String status) {
        String[] steps = {"Placed", "Paid", "Shipped", "Delivered"};
        int active = switch (status == null ? "" : status) {
            case "paid" -> 1;
            case "shipped" -> 2;
            case "completed" -> 3;
            default -> 0;
        };
        StringBuilder cells = new StringBuilder();
        for (int i = 0; i < steps.length; i++) {
            boolean done = i <= active;
            cells.append("<td align=\"center\" width=\"25%\" style=\"padding:0 2px;\">")
                    .append("<div style=\"width:12px;height:12px;border-radius:50%;margin:0 auto 8px;background:")
                    .append(done ? BRAND : "#e4e0f2").append(";\"></div>")
                    .append("<div style=\"font-size:11px;font-weight:600;color:").append(done ? INK : MUTED)
                    .append(";\">").append(steps[i]).append("</div></td>");
        }
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
                + "style=\"margin:0 0 22px;border:1px solid " + BORDER + ";border-radius:14px;\"><tr>"
                + "<td style=\"padding:18px 10px;\"><table role=\"presentation\" width=\"100%\" "
                + "cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" + cells + "</tr></table></td></tr></table>";
    }

    private String pill(String status) {
        String label = status == null ? "" : status.trim();
        String bg;
        String fg;
        switch (label.toLowerCase(Locale.ENGLISH)) {
            case "paid", "completed", "approved", "delivered" -> {
                bg = "#dcfce7";
                fg = "#15803d";
            }
            case "shipped" -> {
                bg = "#dbeafe";
                fg = "#1d4ed8";
            }
            case "cancelled", "rejected" -> {
                bg = "#fee2e2";
                fg = "#b91c1c";
            }
            case "pending" -> {
                bg = "#fef3c7";
                fg = "#b45309";
            }
            default -> {
                bg = "#ede9fe";
                fg = "#5b21b6";
            }
        }
        return "<span style=\"display:inline-block;padding:5px 12px;border-radius:999px;font-size:12px;"
                + "font-weight:700;letter-spacing:.3px;text-transform:capitalize;background:" + bg
                + ";color:" + fg + ";\">" + escape(label) + "</span>";
    }

    /* ---------------- Copy helpers ---------------- */

    private static String statusHeading(Order order) {
        return switch (order.status == null ? "" : order.status) {
            case "paid" -> "Payment received for order #" + order.id;
            case "shipped" -> "Order #" + order.id + " is on the way";
            case "completed" -> "Order #" + order.id + " has been delivered";
            case "cancelled" -> "Order #" + order.id + " has been cancelled";
            default -> "Order #" + order.id + " is confirmed";
        };
    }

    private static String statusMessage(String status) {
        return switch (status == null ? "" : status) {
            case "paid" -> "We have received your payment and your order is being prepared for dispatch.";
            case "shipped" -> "Good news: your parcel has left our warehouse and is on its way to you.";
            case "completed" -> "Your order has been delivered. We hope you love it.";
            case "cancelled" -> "Your order has been cancelled and any reserved stock has been released.";
            default -> "Your order has been received and is waiting to be processed.";
        };
    }

    private static String nav(String label, String href) {
        return "<a href=\"" + escape(href) + "\" style=\"color:" + BRAND + ";font-weight:600;"
                + "text-decoration:none;\">" + escape(label) + "</a>";
    }

    private static String sep() {
        return "<span style=\"color:#c9c3e0;\">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>";
    }

    private static String money(double value) {
        return "&yen;" + String.format(Locale.ENGLISH, "%,.2f", value);
    }

    private static String date(LocalDateTime value) {
        return value == null ? "" : DATE.format(value) + " UTC";
    }

    private static String payment(String method) {
        if (method == null || method.isBlank()) {
            return "Not specified";
        }
        return switch (method.toLowerCase(Locale.ENGLISH)) {
            case "alipay" -> "Alipay";
            case "wechat", "wechatpay", "wechat_pay" -> "WeChat Pay";
            case "cod", "cash", "cash_on_delivery" -> "Cash on delivery";
            case "card" -> "Card";
            default -> Character.toUpperCase(method.charAt(0)) + method.substring(1);
        };
    }

    private static String orderText(Order order) {
        StringBuilder sb = new StringBuilder();
        for (OrderItem item : order.items) {
            sb.append("- ").append(item.productName);
            if (item.style != null && !item.style.isBlank()) {
                sb.append(" (").append(item.style).append(')');
            }
            if (item.size != null && !item.size.isBlank()) {
                sb.append(" size ").append(item.size);
            }
            sb.append(" x").append(item.quantity)
                    .append(" - ").append(plainMoney(item.unitPrice * item.quantity)).append('\n');
        }
        return sb.toString().trim();
    }

    private static String plainMoney(double value) {
        return "¥" + String.format(Locale.ENGLISH, "%,.2f", value);
    }

    private static String plain(String... lines) {
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            if (line == null || line.isBlank()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append("\n\n");
            }
            sb.append(line);
        }
        return sb.toString();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
