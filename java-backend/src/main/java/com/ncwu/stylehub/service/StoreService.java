package com.ncwu.stylehub.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.CartItem;
import com.ncwu.stylehub.domain.Product;
import com.ncwu.stylehub.domain.Review;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.security.PasswordHasher;
import com.ncwu.stylehub.web.dto.AuthDtos.UserOut;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminCreateUserRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.AdminStats;
import com.ncwu.stylehub.web.dto.StoreDtos.CartItemCreate;
import com.ncwu.stylehub.web.dto.StoreDtos.CartItemOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ReviewCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ReviewOut;
import com.ncwu.stylehub.web.dto.StoreDtos.UserPatchRequest;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Review moderation, persistent cart, user management and dashboard stats. */
@Service
public class StoreService {

    @PersistenceContext
    private EntityManager em;

    private final MailService mailService;

    public StoreService(MailService mailService) {
        this.mailService = mailService;
    }

    /* ---------------- Reviews ---------------- */

    @Transactional(readOnly = true)
    public List<ReviewOut> productReviews(long productId) {
        return em.createQuery("SELECT r FROM Review r WHERE r.product.id = :pid AND r.status = 'approved' " +
                        "ORDER BY r.createdAt DESC", Review.class)
                .setParameter("pid", productId).getResultList().stream().map(StoreService::toReviewOut).toList();
    }

    @Transactional
    public ReviewOut submitReview(long userId, ReviewCreateRequest req) {
        Product product = em.find(Product.class, req.productId());
        if (product == null || !product.isActive) {
            throw new ApiException(404, "Product not found");
        }
        Review review = new Review();
        review.product = product;
        review.user = em.find(User.class, userId);
        review.rating = req.rating();
        review.comment = req.comment() != null ? req.comment() : "";
        review.status = "pending";
        em.persist(review);
        return toReviewOut(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewOut> adminReviews(String statusFilter) {
        String jpql = statusFilter != null && !statusFilter.isBlank()
                ? "SELECT r FROM Review r WHERE r.status = :s ORDER BY r.createdAt DESC"
                : "SELECT r FROM Review r ORDER BY r.createdAt DESC";
        var query = em.createQuery(jpql, Review.class);
        if (statusFilter != null && !statusFilter.isBlank()) {
            query.setParameter("s", statusFilter);
        }
        return query.getResultList().stream().map(StoreService::toReviewOut).toList();
    }

    @Transactional
    public ReviewOut moderateReview(long reviewId, String status) {
        Review review = em.find(Review.class, reviewId);
        if (review == null) {
            throw new ApiException(404, "Review not found");
        }
        review.status = status;
        return toReviewOut(review);
    }

    @Transactional
    public void deleteReview(long reviewId) {
        Review review = em.find(Review.class, reviewId);
        if (review == null) {
            throw new ApiException(404, "Review not found");
        }
        em.remove(review);
    }

    /** Hard delete: removes the user plus their orders, order items, cart items and reviews. */
    @Transactional
    public void deleteUser(long currentAdminId, long userId) {
        if (currentAdminId == userId) {
            throw new ApiException(400, "You cannot delete your own account");
        }
        User user = em.find(User.class, userId);
        if (user == null) {
            throw new ApiException(404, "User not found");
        }
        em.createQuery("DELETE FROM OrderItem oi WHERE oi.order.id IN " +
                        "(SELECT o.id FROM PurchaseOrder o WHERE o.user.id = :uid)")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM PurchaseOrder o WHERE o.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM CartItem c WHERE c.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Wishlist w WHERE w.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.createQuery("DELETE FROM Review r WHERE r.user.id = :uid")
                .setParameter("uid", userId).executeUpdate();
        em.remove(user);
    }

    /* ---------------- Cart ---------------- */

    @Transactional(readOnly = true)
    public List<CartItemOut> cart(long userId) {
        return em.createQuery("SELECT c FROM CartItem c WHERE c.user.id = :uid", CartItem.class)
                .setParameter("uid", userId).getResultList().stream().map(StoreService::toCartOut).toList();
    }

    @Transactional
    public CartItemOut addToCart(long userId, CartItemCreate req) {
        Product product = em.find(Product.class, req.productId());
        if (product == null || !product.isActive) {
            throw new ApiException(404, "Product not found");
        }
        String size = normalizeSize(req.size());
        // Same product + same size merges quantity; different sizes stay separate lines.
        CartItem item = em.createQuery(
                        "SELECT c FROM CartItem c WHERE c.user.id = :uid AND c.product.id = :pid " +
                                "AND COALESCE(c.size, '') = :size", CartItem.class)
                .setParameter("uid", userId).setParameter("pid", req.productId()).setParameter("size", size)
                .getResultStream().findFirst().orElse(null);
        if (item == null) {
            item = new CartItem();
            item.user = em.find(User.class, userId);
            item.product = product;
            item.size = size;
            item.quantity = req.quantity();
            em.persist(item);
        } else {
            item.quantity += req.quantity();
        }
        return toCartOut(item);
    }

    @Transactional
    public CartItemOut updateCartItem(long userId, long itemId, int quantity) {
        CartItem item = ownedCartItem(userId, itemId);
        item.quantity = quantity;
        return toCartOut(item);
    }

    @Transactional
    public void removeCartItem(long userId, long itemId) {
        em.remove(ownedCartItem(userId, itemId));
    }

    @Transactional
    public void clearCart(long userId) {
        em.createQuery("DELETE FROM CartItem c WHERE c.user.id = :uid").setParameter("uid", userId).executeUpdate();
    }

    /* ---------------- Users (admin) ---------------- */

    @Transactional(readOnly = true)
    public List<UserOut> adminUsers() {
        return em.createQuery("SELECT u FROM User u ORDER BY u.id DESC", User.class)
                .getResultList().stream().map(AuthService::toUserOut).toList();
    }

    /** Admin-created account: sets the password directly, then emails the new user a welcome note. */
    @Transactional
    public UserOut createUser(AdminCreateUserRequest req) {
        String email = req.email().trim().toLowerCase();
        Long existing = em.createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :e", Long.class)
                .setParameter("e", email).getSingleResult();
        if (existing != null && existing > 0) {
            throw new ApiException(400, "Email is already registered");
        }
        User user = new User();
        user.name = req.name().trim();
        user.email = email;
        user.passwordHash = PasswordHasher.hash(req.password());
        user.role = "admin".equals(req.role()) ? "admin" : "customer";
        em.persist(user);
        mailService.sendWelcome(user);
        return AuthService.toUserOut(user);
    }

    @Transactional
    public UserOut patchUser(long adminId, long userId, UserPatchRequest req) {
        User user = em.find(User.class, userId);
        if (user == null) {
            throw new ApiException(404, "User not found");
        }
        if (req.role() != null) {
            if (!req.role().equals("customer") && !req.role().equals("admin")) {
                throw new ApiException(400, "Invalid role");
            }
            user.role = req.role();
        }
        if (req.isActive() != null) {
            if (user.id == adminId && !req.isActive()) {
                throw new ApiException(400, "You cannot disable your own account");
            }
            user.isActive = req.isActive();
        }
        return AuthService.toUserOut(user);
    }

    /* ---------------- Stats ---------------- */

    @Transactional(readOnly = true)
    public AdminStats stats() {
        long products = em.createQuery("SELECT COUNT(p) FROM Product p", Long.class).getSingleResult();
        long users = em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
        long orders = em.createQuery("SELECT COUNT(o) FROM PurchaseOrder o", Long.class).getSingleResult();
        double revenue = em.createQuery("SELECT COALESCE(SUM(o.total), 0.0) FROM PurchaseOrder o", Double.class)
                .getSingleResult();
        long pending = em.createQuery("SELECT COUNT(r) FROM Review r WHERE r.status = 'pending'", Long.class)
                .getSingleResult();
        long lowStock = em.createQuery("SELECT COUNT(p) FROM Product p WHERE p.stock < 5", Long.class)
                .getSingleResult();
        return new AdminStats(products, users, orders, Math.round(revenue * 100) / 100.0, pending, lowStock);
    }

    /* ---------------- Helpers ---------------- */

    private CartItem ownedCartItem(long userId, long itemId) {
        CartItem item = em.find(CartItem.class, itemId);
        if (item == null || item.user.id != userId) {
            throw new ApiException(404, "Cart item not found");
        }
        return item;
    }

    private static ReviewOut toReviewOut(Review r) {
        return new ReviewOut(r.id, r.product.id, r.user.id, r.user.name, r.rating, r.comment, r.status, r.createdAt);
    }

    private static CartItemOut toCartOut(CartItem c) {
        return new CartItemOut(c.id, c.product.id, c.quantity, normalizeSize(c.size), c.product.name,
                c.product.price, c.product.imageUrl, c.product.stock);
    }

    /** Empty/NULL both mean "no size". */
    public static String normalizeSize(String size) {
        return size == null || size.isBlank() ? "" : size.trim();
    }
}
