package com.ncwu.stylehub.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Order;
import com.ncwu.stylehub.domain.OrderItem;
import com.ncwu.stylehub.web.dto.StoreDtos.AnalyticsPoint;
import com.ncwu.stylehub.web.dto.StoreDtos.AnalyticsProduct;
import com.ncwu.stylehub.web.dto.StoreDtos.AnalyticsTotals;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminAnalytics;
import com.ncwu.stylehub.web.dto.StoreDtos.StatusSlice;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Real business analytics computed from stored orders.
 * Profit uses the cost captured on each order line at checkout time, so it is never an estimate.
 */
@Service
public class AnalyticsService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public AdminAnalytics analytics(int requestedDays) {
        int days = Math.max(1, Math.min(requestedDays, 365));
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate firstDay = today.minusDays(days - 1L);
        // Stored timestamps are UTC; the window is expressed in the store's local calendar.
        LocalDateTime from = firstDay.atStartOfDay(zone)
                .withZoneSameInstant(ZoneOffset.UTC)
                .toLocalDateTime();

        List<Order> orders = em.createQuery(
                        "SELECT DISTINCT o FROM PurchaseOrder o LEFT JOIN FETCH o.items WHERE o.createdAt >= :from",
                        Order.class)
                .setParameter("from", from)
                .getResultList();

        Map<Long, double[]> refundsByOrder = new LinkedHashMap<>();
        Map<String, double[]> refundsByProduct = new LinkedHashMap<>();
        List<Object[]> refundRows = em.createQuery(
                        "SELECT r.order.id, r.quantity, r.orderItem.productName, " +
                                "r.orderItem.unitPrice, r.orderItem.unitCost " +
                                "FROM RefundRequest r WHERE r.status = 'approved' AND r.order.createdAt >= :from")
                .setParameter("from", from).getResultList();
        for (Object[] refund : refundRows) {
            long orderId = ((Number) refund[0]).longValue();
            int quantity = ((Number) refund[1]).intValue();
            String name = (String) refund[2];
            double price = ((Number) refund[3]).doubleValue();
            double cost = ((Number) refund[4]).doubleValue();
            double[] totals = refundsByOrder.computeIfAbsent(orderId, k -> new double[3]);
            totals[0] += price * quantity;
            totals[1] += (price - cost) * quantity;
            totals[2] += quantity;
            double[] product = refundsByProduct.computeIfAbsent(name, k -> new double[3]);
            product[0] += quantity;
            product[1] += price * quantity;
            product[2] += (price - cost) * quantity;
        }

        Map<LocalDate, double[]> buckets = new TreeMap<>();
        for (int i = 0; i < days; i += 1) {
            buckets.put(firstDay.plusDays(i), new double[] {0, 0, 0});
        }

        double revenue = 0;
        double profit = 0;
        long orderCount = 0;
        long units = 0;
        Map<String, long[]> statusCounts = new LinkedHashMap<>();
        for (String s : List.of("pending", "paid", "shipped", "completed", "cancelled")) {
            statusCounts.put(s, new long[] {0});
        }
        Map<String, double[]> productTotals = new LinkedHashMap<>();

        for (Order order : orders) {
            long[] status = statusCounts.get(order.status);
            if (status != null) {
                status[0] += 1;
            }
            if ("cancelled".equals(order.status) || "pending".equals(order.status)) {
                continue;
            }
            double[] refunds = refundsByOrder.getOrDefault(order.id, new double[3]);
            double orderRevenue = order.total - refunds[0];
            double orderProfit = 0;
            long orderUnits = 0;
            for (OrderItem item : order.items) {
                double lineProfit = (item.unitPrice - item.unitCost) * item.quantity;
                orderProfit += lineProfit;
                orderUnits += item.quantity;
                if (!"cancelled".equals(order.status)) {
                    double[] row = productTotals.computeIfAbsent(item.productName, k -> new double[] {0, 0, 0});
                    row[0] += item.quantity;                          // units
                    row[1] += item.unitPrice * item.quantity;         // revenue
                    row[2] += lineProfit;                             // profit
                }
            }
            orderProfit -= refunds[1];

            revenue += orderRevenue;
            profit += orderProfit;
            orderCount += 1;
            units += Math.max(0, orderUnits - (long) refunds[2]);

            double[] bucket = buckets.get(
                    order.createdAt.atOffset(ZoneOffset.UTC).atZoneSameInstant(zone).toLocalDate());
            if (bucket != null) {
                bucket[0] += orderRevenue;
                bucket[1] += orderProfit;
                bucket[2] += 1;
            }
        }

        refundsByProduct.forEach((name, refund) -> {
            double[] product = productTotals.get(name);
            if (product != null) {
                product[0] = Math.max(0, product[0] - refund[0]);
                product[1] -= refund[1];
                product[2] -= refund[2];
            }
        });

        List<AnalyticsPoint> series = new ArrayList<>(days);
        for (Map.Entry<LocalDate, double[]> e : buckets.entrySet()) {
            series.add(new AnalyticsPoint(
                    e.getKey().toString(),
                    round(e.getValue()[0]),
                    round(e.getValue()[1]),
                    (int) e.getValue()[2]));
        }

        List<AnalyticsProduct> topProducts = productTotals.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue()[1], a.getValue()[1]))
                .limit(5)
                .map(e -> new AnalyticsProduct(e.getKey(), (int) e.getValue()[0],
                        round(e.getValue()[1]), round(e.getValue()[2])))
                .toList();

        List<StatusSlice> status = statusCounts.entrySet().stream()
                .map(e -> new StatusSlice(e.getKey(), e.getValue()[0]))
                .toList();

        AnalyticsTotals totals = new AnalyticsTotals(
                round(revenue), round(profit),
                orderCount > 0 ? round(revenue / orderCount) : 0,
                orderCount, units);

        long products = em.createQuery("SELECT COUNT(p) FROM Product p", Long.class).getSingleResult();
        long users = em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
        long lowStock = em.createQuery("SELECT COUNT(p) FROM Product p WHERE p.stock < 5", Long.class)
                .getSingleResult();
        long pendingReviews = em.createQuery("SELECT COUNT(r) FROM Review r WHERE r.status = 'pending'", Long.class)
                .getSingleResult();
        long subscribers = em.createQuery("SELECT COUNT(s) FROM Subscriber s WHERE s.isActive = true", Long.class)
                .getSingleResult();

        return new AdminAnalytics(days, totals, series, topProducts, status,
                products, users, lowStock, pendingReviews, subscribers);
    }

    private static double round(double value) {
        return Math.round(value * 100) / 100.0;
    }
}
