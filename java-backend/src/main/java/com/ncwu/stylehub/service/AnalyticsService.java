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
            double orderRevenue = order.total;
            double orderProfit = 0;
            long orderUnits = 0;
            for (OrderItem item : order.items) {
                double lineProfit = (item.unitPrice - item.unitCost) * item.quantity;
                orderProfit += lineProfit;
                orderUnits += item.quantity;
                double[] row = productTotals.computeIfAbsent(item.productName, k -> new double[] {0, 0, 0});
                row[0] += item.quantity;                          // units
                row[1] += item.unitPrice * item.quantity;         // revenue
                row[2] += lineProfit;                             // profit
            }

            long[] status = statusCounts.get(order.status);
            if (status != null) {
                status[0] += 1;
            }

            // Cancelled orders still count in the status split but must not inflate money totals.
            if ("cancelled".equals(order.status)) {
                continue;
            }

            revenue += orderRevenue;
            profit += orderProfit;
            orderCount += 1;
            units += orderUnits;

            double[] bucket = buckets.get(
                    order.createdAt.atOffset(ZoneOffset.UTC).atZoneSameInstant(zone).toLocalDate());
            if (bucket != null) {
                bucket[0] += orderRevenue;
                bucket[1] += orderProfit;
                bucket[2] += 1;
            }
        }

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
