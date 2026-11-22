package com.ncwu.stylehub.service;

import java.time.ZoneOffset;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.OrderItem;
import com.ncwu.stylehub.domain.Product;
import com.ncwu.stylehub.domain.ProductVariant;
import com.ncwu.stylehub.domain.RefundRequest;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderItemIn;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderItemOut;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderOut;
import com.ncwu.stylehub.web.dto.StoreDtos.RefundDecision;
import com.ncwu.stylehub.web.dto.StoreDtos.RefundRequestCreate;
import com.ncwu.stylehub.web.dto.StoreDtos.RefundRequestOut;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

/** Checkout and order history — stock decrement + totals with the store's shipping rules. */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    /** Mirrors frontend/src/lib/utils.ts (FREE_SHIPPING_THRESHOLD / shippingFor). */
    private static final double FREE_SHIPPING_THRESHOLD = 80.0;
    private static final double SHIPPING_FEE = 6.9;

    @PersistenceContext
    private EntityManager em;

    private final MailService mailService;

    public OrderService(MailService mailService) {
        this.mailService = mailService;
    }

    @Transactional
    public OrderOut create(long userId, OrderCreateRequest req) {
        User user = em.find(User.class, userId);
        Order order = new Order();
        order.user = user;
        order.shippingName = req.shippingName();
        order.shippingAddress = req.shippingAddress();
        order.shippingPhone = req.shippingPhone() != null ? req.shippingPhone() : "";
        order.paymentMethod = req.paymentMethod() != null ? req.paymentMethod() : "alipay";
        order.trackingNumber = TrackingCodes.now();

        double subtotal = 0;
        for (OrderItemIn line : req.items().stream()
                .sorted(java.util.Comparator.comparing(OrderItemIn::productId)
                        .thenComparing(i -> i.variantId() == null ? 0L : i.variantId()))
                .toList()) {
            Product product = em.find(Product.class, line.productId(), LockModeType.PESSIMISTIC_WRITE);
            if (product == null || !product.isActive) {
                throw new ApiException(400, "Product " + line.productId() + " is unavailable");
            }
            ProductVariant variant = null;
            if (line.variantId() != null) {
                variant = em.find(ProductVariant.class, line.variantId(), LockModeType.PESSIMISTIC_WRITE);
                if (variant == null || !variant.product.id.equals(product.id)) {
                    throw new ApiException(400, "Selected option for '" + product.name + "' is unavailable");
                }
            } else if (!product.variants.isEmpty()) {
                throw new ApiException(400, "Choose a style and size for '" + product.name + "'");
            }
            int stock = variant == null ? product.stock : variant.stock;
            if (stock < line.quantity()) {
                throw new ApiException(400, "Insufficient stock for '" + product.name
                        + "' (available: " + stock + ")");
            }
            if (variant != null) {
                variant.stock -= line.quantity();
                product.stock = Math.max(0, product.stock - line.quantity());
            } else {
                product.stock -= line.quantity();
            }
            OrderItem item = new OrderItem();
            item.order = order;
            item.product = product;
            item.variant = variant;
            item.productName = product.name;
            item.unitPrice = variant == null ? product.price : variant.price;
            item.unitCost = variant == null ? product.costPrice : variant.costPrice;
            item.quantity = line.quantity();
            item.size = StoreService.normalizeSize(variant == null ? line.size() : variant.size);
            item.style = StoreService.normalizeSize(variant == null ? line.style() : variant.style);
            order.items.add(item);
            subtotal += item.unitPrice * line.quantity();
        }
        double shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
        order.total = Math.round((subtotal + shipping) * 100) / 100.0;
        order.updatedAt = order.createdAt;
        em.persist(order);
        mailService.sendOrderConfirmation(user, order);
        return toOut(order);
    }

    @Transactional(readOnly = true)
    public List<OrderOut> myOrders(long userId) {
        return em.createQuery("SELECT o FROM PurchaseOrder o WHERE o.user.id = :uid ORDER BY o.createdAt DESC",
                        Order.class)
                .setParameter("uid", userId).getResultList().stream().map(OrderService::toOut).toList();
    }

    @Transactional(readOnly = true)
    public OrderOut order(long userId, long orderId) {
        Order order = em.find(Order.class, orderId);
        if (order == null || order.user.id != userId) {
            throw new ApiException(404, "Order not found");
        }
        return toOut(order);
    }

    @Transactional(readOnly = true)
    public List<OrderOut> adminOrders() {
        return em.createQuery("SELECT o FROM PurchaseOrder o ORDER BY o.createdAt DESC", Order.class)
                .getResultList().stream().map(OrderService::toOut).toList();
    }

    /** Hard delete: removes the order and its items permanently. */
    @Transactional
    public void deleteOrder(long orderId) {
        Order order = em.find(Order.class, orderId);
        if (order == null) {
            throw new ApiException(404, "Order not found");
        }
        em.remove(order);
    }

    @Transactional
    public OrderOut updateOrder(long orderId, String status, String trackingNumber) {
        Order order = em.find(Order.class, orderId);
        if (order == null) {
            throw new ApiException(404, "Order not found");
        }
        String previousStatus = order.status;
        String previousTracking = order.trackingNumber;
        if (status != null) {
            if (!List.of("pending", "paid", "shipped", "completed", "cancelled").contains(status)) {
                throw new ApiException(400, "Invalid order status");
            }
            if ("cancelled".equals(previousStatus) && !"cancelled".equals(status)) {
                throw new ApiException(400, "A cancelled order cannot be reopened");
            }
            order.status = status;
        }
        if (trackingNumber != null) {
            order.trackingNumber = trackingNumber.trim();
        }
        boolean statusChanged = status != null && !status.equals(previousStatus);
        boolean trackingChanged = trackingNumber != null
                && !order.trackingNumber.equals(previousTracking == null ? "" : previousTracking);
        if (statusChanged || trackingChanged) {
            order.updatedAt = java.time.LocalDateTime.now(ZoneOffset.UTC);
        }
        if (statusChanged) {
            if ("cancelled".equals(status) && !"cancelled".equals(previousStatus)) {
                restoreStock(order);
            }
            mailService.sendTrackingUpdate(order.user, order);
        }
        return toOut(order);
    }

    /**
     * Customer-initiated cancellation. Only orders that have not shipped yet can be cancelled;
     * stock is returned to the catalog and the customer gets a confirmation email.
     */
    @Transactional
    public OrderOut cancel(long userId, long orderId) {
        Order order = em.find(Order.class, orderId);
        if (order == null || order.user.id != userId) {
            throw new ApiException(404, "Order not found");
        }
        if ("cancelled".equals(order.status)) {
            return toOut(order);
        }
        if (!List.of("pending", "paid").contains(order.status)) {
            throw new ApiException(400, "This order can no longer be cancelled — please contact support.");
        }
        restoreStock(order);
        order.status = "cancelled";
        order.updatedAt = java.time.LocalDateTime.now(ZoneOffset.UTC);
        mailService.sendOrderCancelled(order.user, order);
        return toOut(order);
    }

    @Transactional(readOnly = true)
    public List<RefundRequestOut> myRefunds(long userId) {
        return em.createQuery("SELECT r FROM RefundRequest r WHERE r.user.id = :uid ORDER BY r.requestedAt DESC",
                        RefundRequest.class)
                .setParameter("uid", userId).getResultList().stream().map(OrderService::toRefundOut).toList();
    }

    @Transactional
    public RefundRequestOut requestRefund(long userId, RefundRequestCreate req) {
        OrderItem item = em.find(OrderItem.class, req.orderItemId());
        if (item == null) {
            throw new ApiException(404, "Order item not found");
        }
        // Lock the parent order row rather than the item: order_items has nullable eager
        // joins (product, variant), and PostgreSQL rejects FOR UPDATE on the nullable side
        // of an outer join, which made every refund request fail with a 500.
        Order order = em.find(Order.class, item.order.id, LockModeType.PESSIMISTIC_WRITE);
        if (order == null || order.user.id != userId) {
            throw new ApiException(404, "Order item not found");
        }
        if (!List.of("shipped", "completed").contains(order.status)) {
            throw new ApiException(400, "Refunds can be requested after an order has shipped");
        }
        // Plain per-row read instead of COALESCE(SUM(...)): the aggregate mixes int and
        // long types in JPQL, which Hibernate rejects at query-compile time.
        int alreadyRequested = em.createQuery(
                        "SELECT r.quantity FROM RefundRequest r " +
                                "WHERE r.orderItem.id = :itemId AND r.status IN ('pending', 'approved')", Integer.class)
                .setParameter("itemId", item.id).getResultList().stream()
                .mapToInt(Integer::intValue).sum();
        if (alreadyRequested + req.quantity() > item.quantity) {
            throw new ApiException(400, "Refund quantity exceeds the unrefunded items");
        }
        RefundRequest refund = new RefundRequest();
        refund.order = order;
        refund.orderItem = item;
        refund.user = order.user;
        refund.quantity = req.quantity();
        refund.reason = req.reason().trim();
        em.persist(refund);
        try {
            mailService.sendRefundRequested(refund);
        } catch (RuntimeException e) {
            // The request is already saved; a mail/template problem must not roll it back.
            log.warn("Refund request for order #{} saved but the admin email failed: {}",
                    order.id, e.getMessage());
        }
        return toRefundOut(refund);
    }

    @Transactional(readOnly = true)
    public List<RefundRequestOut> adminRefunds() {
        return em.createQuery("SELECT r FROM RefundRequest r ORDER BY r.requestedAt DESC", RefundRequest.class)
                .getResultList().stream().map(OrderService::toRefundOut).toList();
    }

    @Transactional
    public RefundRequestOut decideRefund(long refundId, RefundDecision decision) {
        RefundRequest refund = em.find(RefundRequest.class, refundId, LockModeType.PESSIMISTIC_WRITE);
        if (refund == null) {
            throw new ApiException(404, "Refund request not found");
        }
        if (!"pending".equals(refund.status)) {
            throw new ApiException(400, "This refund request has already been resolved");
        }
        if (!List.of("approved", "rejected").contains(decision.status())) {
            throw new ApiException(400, "Refund decision must be approved or rejected");
        }
        refund.status = decision.status();
        refund.adminNote = decision.adminNote() == null ? "" : decision.adminNote().trim();
        refund.resolvedAt = java.time.LocalDateTime.now(ZoneOffset.UTC);
        mailService.sendRefundDecision(refund);
        return toRefundOut(refund);
    }

    private static void restoreStock(Order order) {
        for (OrderItem item : order.items) {
            if (item.product != null) {
                if (item.variant != null) {
                    item.variant.stock += item.quantity;
                }
                item.product.stock += item.quantity;
            }
        }
    }

    public static RefundRequestOut toRefundOut(RefundRequest refund) {
        OrderItem item = refund.orderItem;
        return new RefundRequestOut(refund.id, refund.order.id, item.id, item.productName,
                refund.quantity, Math.round(item.unitPrice * refund.quantity * 100.0) / 100.0,
                refund.reason, refund.status, refund.adminNote, refund.requestedAt, refund.resolvedAt);
    }

    public static OrderOut toOut(Order order) {
        List<OrderItemOut> items = order.items.stream()
                .map(i -> new OrderItemOut(i.id, i.product != null ? i.product.id : null,
                        i.productName, i.unitPrice, i.quantity, StoreService.normalizeSize(i.style),
                        StoreService.normalizeSize(i.size),
                        i.product != null ? i.product.imageUrl : ""))
                .toList();
        double itemsSum = items.stream().mapToDouble(i -> i.unitPrice() * i.quantity()).sum();
        double shipping = Math.round((order.total - itemsSum) * 100) / 100.0;
        return new OrderOut(order.id, order.user.id, order.status,
                order.trackingNumber != null ? order.trackingNumber : "",
                order.total, order.shippingName,
                order.shippingAddress, order.shippingPhone, order.paymentMethod, order.createdAt, items,
                shipping, order.updatedAt != null ? order.updatedAt : order.createdAt);
    }
}
