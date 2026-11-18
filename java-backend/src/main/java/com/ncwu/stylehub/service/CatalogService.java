package com.ncwu.stylehub.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Banner;
import com.ncwu.stylehub.domain.Category;
import com.ncwu.stylehub.domain.Product;
import com.ncwu.stylehub.domain.ProductImage;
import com.ncwu.stylehub.domain.Promotion;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.domain.Wishlist;
import com.ncwu.stylehub.exception.ApiException;
import com.ncwu.stylehub.web.dto.StoreDtos.BannerOut;
import com.ncwu.stylehub.web.dto.StoreDtos.CategoryOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductCreateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductImageOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductOut;
import com.ncwu.stylehub.web.dto.StoreDtos.ProductUpdateRequest;
import com.ncwu.stylehub.web.dto.StoreDtos.PromotionOut;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/** Category / product / banner / promotion logic (public catalog + admin product management). */
@Service
public class CatalogService {

    @PersistenceContext
    private EntityManager em;

    /* ---------------- Public catalog ---------------- */

    @Transactional(readOnly = true)
    public List<CategoryOut> categories() {
        return em.createQuery("SELECT c FROM Category c ORDER BY c.sortOrder, c.id", Category.class)
                .getResultList().stream()
                .map(c -> new CategoryOut(c.id, c.name, c.slug, c.description, c.imageUrl, c.sortOrder))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductOut> products(String search, String categorySlug, Boolean featured,
                                     String sort, int page, int pageSize) {
        List<Product> all = new ArrayList<>(em
                .createQuery("SELECT p FROM Product p WHERE p.isActive = true", Product.class)
                .getResultList());

        if (categorySlug != null && !categorySlug.isBlank()) {
            all.removeIf(p -> p.category == null || !categorySlug.equals(p.category.slug));
        }
        if (featured != null) {
            all.removeIf(p -> p.isFeatured != featured);
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            all.removeIf(p -> !contains(p.name, q) && !contains(p.description, q));
        }

        Map<Long, double[]> ratings = ratingSummary(all.stream().map(p -> p.id).toList());
        String s = sort == null ? "newest" : sort;
        Comparator<Product> cmp = switch (s) {
            case "price-asc" -> Comparator.comparingDouble(p -> p.price);
            case "price-desc" -> Comparator.comparingDouble((Product p) -> p.price).reversed();
            case "rating" -> Comparator
                    .comparingDouble((Product p) -> ratings.getOrDefault(p.id, new double[] {0, 0})[0])
                    .reversed()
                    .thenComparing(p -> p.id, Comparator.reverseOrder());
            default -> Comparator.comparing((Product p) -> p.createdAt, Comparator.reverseOrder())
                    .thenComparing(p -> p.id, Comparator.reverseOrder());
        };
        all.sort(cmp);

        int from = Math.min((page - 1) * pageSize, all.size());
        int to = Math.min(from + pageSize, all.size());
        return all.subList(from, to).stream()
                .map(p -> toOut(p, ratings.getOrDefault(p.id, new double[] {0, 0})))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductOut product(long id) {
        Product p = em.find(Product.class, id);
        if (p == null || !p.isActive) {
            throw new ApiException(404, "Product not found");
        }
        return toOut(p, ratingSummary(List.of(id)).getOrDefault(id, new double[] {0, 0}));
    }

    @Transactional(readOnly = true)
    public List<BannerOut> banners() {
        return em.createQuery("SELECT b FROM Banner b WHERE b.isActive = true ORDER BY b.sortOrder, b.id", Banner.class)
                .getResultList().stream()
                .map(b -> new BannerOut(b.id, b.title, b.subtitle, b.imageUrl, b.linkUrl, b.sortOrder, b.isActive))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromotionOut> promotions() {
        return em.createQuery("SELECT p FROM Promotion p WHERE p.isActive = true ORDER BY p.id", Promotion.class)
                .getResultList().stream()
                .map(p -> new PromotionOut(p.id, p.title, p.subtitle, p.badge, p.imageUrl, p.linkUrl, p.position, p.isActive))
                .toList();
    }

    /* ---------------- Admin product management ---------------- */

    @Transactional(readOnly = true)
    public List<ProductOut> adminProducts() {
        List<Product> all = em.createQuery("SELECT p FROM Product p ORDER BY p.id DESC", Product.class)
                .getResultList();
        Map<Long, double[]> ratings = ratingSummary(all.stream().map(p -> p.id).toList());
        return all.stream()
                .map(p -> toOut(p, ratings.getOrDefault(p.id, new double[] {0, 0}), true))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductOut adminProduct(long id) {
        Product p = em.find(Product.class, id);
        if (p == null) {
            throw new ApiException(404, "Product not found");
        }
        return toOut(p, ratingSummary(List.of(id)).getOrDefault(id, new double[] {0, 0}), true);
    }

    @Transactional
    public ProductOut createProduct(ProductCreateRequest req) {
        Category category = em.find(Category.class, req.categoryId());
        if (category == null) {
            throw new ApiException(400, "Category not found");
        }
        String slug = req.slug() != null && !req.slug().isBlank() ? req.slug() : slugify(req.name());
        if (em.createQuery("SELECT COUNT(p) FROM Product p WHERE p.slug = :s", Long.class)
                .setParameter("s", slug).getSingleResult() > 0) {
            slug = slug + "-" + UUID.randomUUID().toString().substring(0, 6);
        }
        Product p = new Product();
        p.name = req.name();
        p.slug = slug;
        p.description = req.description() != null ? req.description() : "";
        p.price = req.price();
        p.compareAtPrice = req.compareAtPrice();
        p.costPrice = req.costPrice();
        p.stock = req.stock();
        p.sizes = req.sizes() != null ? req.sizes() : "";
        p.category = category;
        p.imageUrl = req.imageUrl() != null ? req.imageUrl() : "";
        p.isFeatured = req.isFeatured();
        p.isActive = req.isActive();
        if (req.images() != null) {
            int order = 0;
            for (String url : req.images()) {
                ProductImage img = new ProductImage();
                img.product = p;
                img.imageUrl = url;
                img.sortOrder = order++;
                p.images.add(img);
            }
        }
        em.persist(p);
        return toOut(p, new double[] {0, 0}, true);
    }

    @Transactional
    public ProductOut updateProduct(long id, ProductUpdateRequest req) {
        Product p = em.find(Product.class, id);
        if (p == null) {
            throw new ApiException(404, "Product not found");
        }
        if (req.name() != null) {
            p.name = req.name();
        }
        if (req.slug() != null) {
            p.slug = req.slug();
        }
        if (req.description() != null) {
            p.description = req.description();
        }
        if (req.price() != null) {
            p.price = req.price();
        }
        if (req.compareAtPrice() != null) {
            p.compareAtPrice = req.compareAtPrice();
        }
        if (req.costPrice() != null) {
            p.costPrice = req.costPrice();
        }
        if (req.stock() != null) {
            p.stock = req.stock();
        }
        if (req.sizes() != null) {
            p.sizes = req.sizes();
        }
        if (req.categoryId() != null) {
            Category category = em.find(Category.class, req.categoryId());
            if (category == null) {
                throw new ApiException(400, "Category not found");
            }
            p.category = category;
        }
        if (req.imageUrl() != null) {
            p.imageUrl = req.imageUrl();
        }
        if (req.isFeatured() != null) {
            p.isFeatured = req.isFeatured();
        }
        if (req.isActive() != null) {
            p.isActive = req.isActive();
        }
        if (req.images() != null) {
            replaceImages(p, req.images());
        }
        return toOut(p, ratingSummary(List.of(id)).getOrDefault(id, new double[] {0, 0}), true);
    }

    /** Replaces the product gallery (max 4 URLs) and keeps the primary image in sync. */
    private void replaceImages(Product p, List<String> urls) {
        List<String> clean = urls.stream()
                .filter(u -> u != null && !u.isBlank())
                .limit(4)
                .toList();
        p.images.clear();
        int order = 0;
        for (String url : clean) {
            ProductImage img = new ProductImage();
            img.product = p;
            img.imageUrl = url;
            img.sortOrder = order++;
            p.images.add(img);
        }
        if (!clean.isEmpty()
                && (p.imageUrl == null || p.imageUrl.isBlank() || !clean.contains(p.imageUrl))) {
            p.imageUrl = clean.get(0);
        }
    }

    @Transactional
    public void deleteProduct(long id) {
        Product p = em.find(Product.class, id);
        if (p == null) {
            throw new ApiException(404, "Product not found");
        }
        em.remove(p);
    }

    @Transactional
    public ProductOut attachImage(long id, String imageUrl) {
        Product p = em.find(Product.class, id);
        if (p == null) {
            throw new ApiException(404, "Product not found");
        }
        if (p.images.size() >= 4) {
            throw new ApiException(400, "Maximum 4 images per product");
        }
        if (p.imageUrl == null || p.imageUrl.isBlank()) {
            p.imageUrl = imageUrl;
        }
        ProductImage img = new ProductImage();
        img.product = p;
        img.imageUrl = imageUrl;
        img.sortOrder = p.images.size();
        p.images.add(img);
        return toOut(p, ratingSummary(List.of(id)).getOrDefault(id, new double[] {0, 0}));
    }

    /* ---------------- Wishlist ---------------- */

    @Transactional(readOnly = true)
    public List<ProductOut> wishlistProducts(long userId) {
        List<Product> saved = em.createQuery(
                        "SELECT w.product FROM Wishlist w WHERE w.user.id = :uid ORDER BY w.createdAt DESC",
                        Product.class)
                .setParameter("uid", userId).getResultList();
        Map<Long, double[]> ratings = ratingSummary(saved.stream().map(p -> p.id).toList());
        return saved.stream().map(p -> toOut(p, ratings.getOrDefault(p.id, new double[] {0, 0}))).toList();
    }

    @Transactional
    public void addWishlist(long userId, long productId) {
        Product product = em.find(Product.class, productId);
        if (product == null || !product.isActive) {
            throw new ApiException(404, "Product not found");
        }
        long count = em.createQuery(
                        "SELECT COUNT(w) FROM Wishlist w WHERE w.user.id = :uid AND w.product.id = :pid", Long.class)
                .setParameter("uid", userId).setParameter("pid", productId).getSingleResult();
        if (count == 0) {
            Wishlist w = new Wishlist();
            w.user = em.find(User.class, userId);
            w.product = product;
            em.persist(w);
        }
    }

    @Transactional
    public void removeWishlist(long userId, long productId) {
        em.createQuery("DELETE FROM Wishlist w WHERE w.user.id = :uid AND w.product.id = :pid")
                .setParameter("uid", userId).setParameter("pid", productId).executeUpdate();
    }

    /* ---------------- Helpers ---------------- */

    private Map<Long, double[]> ratingSummary(List<Long> ids) {
        Map<Long, double[]> map = new HashMap<>();
        if (ids.isEmpty()) {
            return map;
        }
        List<Object[]> rows = em.createQuery(
                        "SELECT r.product.id, AVG(r.rating), COUNT(r) FROM Review r " +
                                "WHERE r.status = 'approved' AND r.product.id IN :ids GROUP BY r.product.id")
                .setParameter("ids", ids).getResultList();
        for (Object[] row : rows) {
            map.put((Long) row[0], new double[] {
                    ((Number) row[1]).doubleValue(), ((Number) row[2]).doubleValue()});
        }
        return map;
    }

    private ProductOut toOut(Product p, double[] rating) {
        return toOut(p, rating, false);
    }

    private ProductOut toOut(Product p, double[] rating, boolean includeCost) {
        double avg = Math.round(rating[0] * 10) / 10.0;
        return new ProductOut(
                p.id, p.name, p.slug, p.description, p.price, p.compareAtPrice, p.stock,
                p.sizes != null ? p.sizes : "",
                p.category.id, p.category.name, p.category.slug, p.imageUrl,
                p.isFeatured, p.isActive, p.createdAt,
                p.images.stream().map(i -> new ProductImageOut(i.id, i.imageUrl, i.sortOrder)).toList(),
                avg, (int) rating[1],
                includeCost ? p.costPrice : null);
    }

    private static boolean contains(String text, String q) {
        return text != null && text.toLowerCase().contains(q);
    }

    public static String slugify(String text) {
        String slug = text.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return slug.isEmpty() ? "item-" + UUID.randomUUID().toString().substring(0, 8) : slug;
    }
}
