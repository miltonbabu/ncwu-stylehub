package com.ncwu.stylehub.web.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Catalog, review, cart, order and admin DTOs (JSON keys match the Python API). */
public final class StoreDtos {

    private StoreDtos() {
    }

    /* ---------- Categories / Products ---------- */

    public record CategoryOut(long id, String name, String slug, String description, String imageUrl, int sortOrder) {
    }

    public record ProductImageOut(long id, String imageUrl, int sortOrder) {
    }

    public record ProductOut(
            long id, String name, String slug, String description, double price, Double compareAtPrice,
            int stock, String sizes, long categoryId, String categoryName, String categorySlug, String imageUrl,
            boolean isFeatured, boolean isActive, LocalDateTime createdAt,
            List<ProductImageOut> images, double avgRating, int reviewCount,
            /** Only populated for admin responses — hidden from the public catalog. */
            Double costPrice, List<ProductVariantOut> variants) {
    }

    public record ProductVariantOut(long id, String style, String size, double price, Double compareAtPrice,
                                    int stock, String imageUrl, Double costPrice) {
    }

    public record ProductVariantIn(Long id, String style, String size, @Positive double price,
                                   Double compareAtPrice, @Min(0) double costPrice,
                                   @Min(0) int stock, String imageUrl) {
    }

    public record ProductCreateRequest(
            @NotBlank String name,
            String slug,
            String description,
            @Positive double price,
            Double compareAtPrice,
            @Min(0) double costPrice,
            @Min(0) int stock,
            String sizes,
            @NotNull Long categoryId,
            String imageUrl,
            boolean isFeatured,
            boolean isActive,
            List<String> images,
            List<ProductVariantIn> variants) {
    }

    public record ProductUpdateRequest(
            String name, String slug, String description, Double price, Double compareAtPrice,
            Double costPrice, Integer stock, String sizes, Long categoryId, String imageUrl,
            Boolean isFeatured, Boolean isActive, List<String> images, List<ProductVariantIn> variants) {
    }

    /* ---------- Banners / Promotions ---------- */

    public record BannerOut(long id, String title, String subtitle, String imageUrl, String linkUrl,
                            int sortOrder, boolean isActive) {
    }

    public record PromotionOut(long id, String title, String subtitle, String badge, String imageUrl,
                               String linkUrl, String position, boolean isActive) {
    }

    /* ---------- Reviews ---------- */

    public record ReviewCreateRequest(
            @NotNull Long productId,
            @Min(1) @Max(5) int rating,
            String comment) {
    }

    public record ReviewOut(long id, long productId, long userId, String userName, int rating,
                            String comment, String status, LocalDateTime createdAt) {
    }

    /* ---------- Cart ---------- */

    public record CartItemCreate(@NotNull Long productId, Long variantId, @Min(1) int quantity,
                                 String style, String size) {
    }

    public record CartItemUpdate(@Min(1) int quantity) {
    }

    public record CartItemOut(long id, long productId, Long variantId, int quantity, String style, String size,
                              String productName, double productPrice, String productImage, int stock) {
    }

    /* ---------- Orders ---------- */

    public record OrderItemIn(@NotNull Long productId, Long variantId, @Min(1) int quantity,
                              String style, String size) {
    }

    public record OrderCreateRequest(
            @NotBlank String shippingName,
            @NotBlank String shippingAddress,
            String shippingPhone,
            String paymentMethod,
            /** Required only for guest checkout (no signed-in account). */
            String guestEmail,
            @NotEmpty List<OrderItemIn> items) {
    }

    /** Public order lookup: the caller proves ownership with the email used at checkout. */
    public record OrderTrackRequest(@NotNull Long orderId, @NotBlank String email) {
    }

    /* ---------- Address book ---------- */

    public record AddressOut(long id, String label, String fullName, String phone, String address,
                             boolean isDefault) {
    }

    public record AddressRequest(
            @jakarta.validation.constraints.Size(max = 40) String label,
            @NotBlank @jakarta.validation.constraints.Size(max = 100) String fullName,
            @jakarta.validation.constraints.Size(max = 30) String phone,
            @NotBlank @jakarta.validation.constraints.Size(max = 300) String address,
            Boolean isDefault) {
    }

    public record OrderItemOut(Long id, Long productId, String productName, double unitPrice,
                               int quantity, String style, String size, String productImage) {
    }

    public record OrderOut(long id, Long userId, String status, String trackingNumber, double total,
                           String shippingName, String shippingAddress, String shippingPhone, String paymentMethod,
                           LocalDateTime createdAt, List<OrderItemOut> items, double shipping,
                           /** Email used at checkout; empty for signed-in orders. */
                           String guestEmail,
                           /** Account name and email, so the back office can tell account orders from guest ones. */
                           String customerName, String customerEmail,
                           /** Last status / tracking change, so customers can see the latest update time. */
                           LocalDateTime updatedAt) {
    }

    public record RefundRequestCreate(@NotNull Long orderItemId, @Min(1) int quantity,
                                      @NotBlank @jakarta.validation.constraints.Size(max = 1000) String reason) {
    }

    public record RefundDecision(@NotBlank String status,
                                 @jakarta.validation.constraints.Size(max = 1000) String adminNote) {
    }

    public record RefundRequestOut(long id, long orderId, long orderItemId, String productName,
                                   int quantity, double amount, String reason, String status,
                                   String adminNote, LocalDateTime requestedAt, LocalDateTime resolvedAt) {
    }

    /* ---------- NCWU StyleHub Club (newsletter) ---------- */

    public record ClubSubscribeRequest(@NotBlank @jakarta.validation.constraints.Email String email) {
    }

    public record SubscriberOut(long id, String email, String source, boolean isActive, LocalDateTime createdAt) {
    }

    /* ---------- Contact form ---------- */

    public record ContactRequest(
            @NotBlank @jakarta.validation.constraints.Size(max = 100) String name,
            @NotBlank @jakarta.validation.constraints.Email String email,
            @jakarta.validation.constraints.Size(max = 200) String subject,
            @NotBlank @jakarta.validation.constraints.Size(max = 2000) String message) {
    }

    public record ContactMessageOut(long id, String name, String email, String subject, String message,
                                    boolean isRead, LocalDateTime createdAt) {
    }

    public record OrderPatchRequest(String status, String trackingNumber) {
    }

    /* ---------- Admin ---------- */

    public record UserPatchRequest(String role, Boolean isActive) {
    }

    public record AdminCreateUserRequest(
            @NotBlank String name,
            @jakarta.validation.constraints.Email @NotBlank String email,
            @jakarta.validation.constraints.Size(min = 8, max = 128) String password,
            String role) {
    }

    public record AdminStats(long products, long users, long orders, double revenue,
                             long pendingReviews, long lowStock) {
    }

    /* ---------- Analytics (admin only) ---------- */

    public record AnalyticsPoint(String date, double revenue, double profit, int orders) {
    }

    public record AnalyticsProduct(String name, int units, double revenue, double profit) {
    }

    public record AnalyticsTotals(double revenue, double profit, double avgOrder, long orders, long units) {
    }

    public record AdminAnalytics(int days, AnalyticsTotals totals, List<AnalyticsPoint> series,
                                 List<AnalyticsProduct> topProducts, List<StatusSlice> statusCounts,
                                 long products, long users, long lowStock, long pendingReviews,
                                 long subscribers) {
    }

    public record StatusSlice(String status, long count) {
    }
}

