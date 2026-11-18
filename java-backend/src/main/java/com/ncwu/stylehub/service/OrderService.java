package com.ncwu.stylehub.service;

import java.time.ZoneOffset;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.OrderItem;
import com.ncwu.stylehub.domain.Product;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderItemIn;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderItemOut;
import com.ncwu.stylehub.web.dto.StoreDtos.OrderOut;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Checkout and order history — stock decrement + totals with the store's shipping rules. */
@Service
public class OrderService {

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
        for (OrderItemIn line : req.items()) {
            Product product = em.find(Product.class, line.productId());
            if (product == null || !product.isActive) {
                throw new ApiException(400, "Product " + line.productId() + " is unavailable");
            }
            if (product.stock < line.quantity()) {
                throw new ApiException(400, "Insufficient stock for '" + product.name
                        + "' (available: " + product.stock + ")");
            }
            product.stock -= line.quantity();
            OrderItem item = new OrderItem();
            item.order = order;
            item.product = product;
            item.productName = product.name;
            item.unitPrice = product.price;
            item.unitCost = product.costPrice;
            item.quantity = line.quantity();
            item.size = StoreService.normalizeSize(line.size());
            order.items.add(item);
            subtotal += product.price * line.quantity();
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
        for (OrderItem item : order.items) {
            if (item.product != null) {
                item.product.stock += item.quantity;
            }
        }
        order.status = "cancelled";
        order.updatedAt = java.time.LocalDateTime.now(ZoneOffset.UTC);
        mailService.sendOrderCancelled(order.user, order);
        return toOut(order);
    }

    public static OrderOut toOut(Order order) {
        List<OrderItemOut> items = order.items.stream()
                .map(i -> new OrderItemOut(i.id, i.product != null ? i.product.id : null,
                        i.productName, i.unitPrice, i.quantity, StoreService.normalizeSize(i.size),
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
