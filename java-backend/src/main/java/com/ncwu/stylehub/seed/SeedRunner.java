package com.ncwu.stylehub.seed;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ncwu.stylehub.domain.Banner;
import com.ncwu.stylehub.domain.Category;
import com.ncwu.stylehub.domain.Product;
import com.ncwu.stylehub.domain.Promotion;
import com.ncwu.stylehub.domain.Review;
import com.ncwu.stylehub.domain.User;
import com.ncwu.stylehub.security.PasswordHasher;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Seeds demo data on first startup (identical to the Python backend seed):
 * admin@shop.ncwu.site / admin@123 and user@shop.ncwu.site / demo@123
 */
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true", matchIfMissing = true)
public class SeedRunner implements CommandLineRunner {

    private static final String IMG = "https://images.unsplash.com/photo-%s?auto=format&fit=crop&w=900&q=70";
    private static final String WIDE = "https://images.unsplash.com/photo-%s?auto=format&fit=crop&w=1600&q=70";

    private static final Map<String, String> P = Map.ofEntries(
            Map.entry("tee_white", "1521572163474-6864f9cf17ab"),
            Map.entry("rack", "1523381210434-271e8be1f52b"),
            Map.entry("store", "1441986300917-64674bd600d8"),
            Map.entry("bags", "1483985988355-763728e1935b"),
            Map.entry("fashion_w", "1490481651871-ab68de25d43d"),
            Map.entry("fashion_w2", "1445205170230-053b83016050"),
            Map.entry("model_w", "1489987707025-afc232f7ea0f"),
            Map.entry("denim_jacket", "1515886657613-9f3515b0c78f"),
            Map.entry("jeans", "1542272604-787c3835535d"),
            Map.entry("sneakers", "1560769629-975ec94e6a86"),
            Map.entry("sneakers2", "1549298916-b41d501d3772"),
            Map.entry("yellow_jacket", "1469334031218-e382a71b716b"),
            Map.entry("coat_m", "1434389677669-e08b4cac3105"));

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(String... args) {
        Long userCount = em.createQuery("SELECT COUNT(u) FROM User u", Long.class).getSingleResult();
        if (userCount != null && userCount > 0) {
            return;
        }

        User admin = new User();
        admin.name = "Store Admin";
        admin.email = "admin@shop.ncwu.site";
        admin.passwordHash = PasswordHasher.hash("admin@123");
        admin.role = "admin";
        em.persist(admin);

        User demo = new User();
        demo.name = "Demo Customer";
        demo.email = "user@shop.ncwu.site";
        demo.passwordHash = PasswordHasher.hash("demo@123");
        demo.role = "customer";
        em.persist(demo);

        Map<String, Category> categories = new HashMap<>();
        String[][] catRows = {
                {"T-Shirts", "t-shirts", "Soft cotton essentials and statement tees for every day.", "tee_white"},
                {"Dresses", "dresses", "From casual day dresses to elegant evening styles.", "fashion_w"},
                {"Jackets & Coats", "jackets-coats", "Outerwear that keeps you warm and stylish.", "coat_m"},
                {"Jeans & Pants", "jeans-pants", "Denim classics and tailored fits.", "jeans"},
                {"Shoes", "shoes", "Sneakers, boots and loafers to complete the look.", "sneakers"},
                {"Accessories", "accessories", "Bags, scarves, hats and finishing touches.", "bags"},
        };
        for (int i = 0; i < catRows.length; i++) {
            Category c = new Category();
            c.name = catRows[i][0];
            c.slug = catRows[i][1];
            c.description = catRows[i][2];
            c.imageUrl = String.format(IMG, P.get(catRows[i][3]));
            c.sortOrder = i;
            em.persist(c);
            categories.put(c.slug, c);
        }

        Object[][] products = {
                {"Classic White Cotton Tee", "t-shirts", 24.90, 34.90, 120, true, "tee_white",
                        "Our signature crew-neck tee in 100% organic cotton. Pre-shrunk, breathable and endlessly versatile."},
                {"Oversized Street Graphic Tee", "t-shirts", 29.90, null, 85, true, "rack",
                        "Relaxed oversized fit with a bold back graphic. Perfect with jeans or layered under a jacket."},
                {"Ribbed Fitted Long Sleeve", "t-shirts", 27.90, 37.90, 95, false, "model_w",
                        "Stretch ribbed knit that hugs in all the right places. A wardrobe staple for cooler days."},
                {"Floral Summer Midi Dress", "dresses", 59.90, 79.90, 40, true, "fashion_w",
                        "Flowy midi dress with a ditsy floral print, smocked bodice and adjustable straps."},
                {"Satin Evening Slip Dress", "dresses", 74.90, null, 28, true, "fashion_w2",
                        "Lustrous satin slip dress with a cowl neckline. Dress it up with heels for any occasion."},
                {"Denim Trench Coat", "jackets-coats", 99.90, 129.90, 22, true, "denim_jacket",
                        "Washed denim trench with a belted waist and storm flap. An instant outfit-maker."},
                {"Wool Blend Overcoat", "jackets-coats", 129.90, 159.90, 18, true, "coat_m",
                        "Tailored wool-blend overcoat with notch lapels and deep pockets. Timeless elegance."},
                {"Classic Slim Jeans", "jeans-pants", 49.90, 64.90, 110, true, "jeans",
                        "Slim-fit stretch denim in a mid-blue wash. Comfort that holds its shape all day."},
                {"High-Rise Wide Leg Trousers", "jeans-pants", 54.90, null, 60, false, "yellow_jacket",
                        "Fluid wide-leg trousers with a flattering high rise. Office to evening, effortless."},
                {"Retro Runner Sneakers", "shoes", 69.90, 89.90, 75, true, "sneakers",
                        "Cushioned retro runners with a suede-and-mesh upper. All-day comfort, iconic style."},
                {"Court Classic Low Tops", "shoes", 64.90, null, 90, false, "sneakers2",
                        "Clean leather low-tops with a gum sole. The sneakers that go with literally everything."},
                {"Everyday Leather Tote", "accessories", 44.90, 59.90, 55, true, "bags",
                        "Structured vegan-leather tote with a zip pocket and laptop sleeve. Work-ready and chic."},
        };
        Product[] created = new Product[products.length];
        for (int i = 0; i < products.length; i++) {
            Product p = new Product();
            p.name = (String) products[i][0];
            p.slug = p.name.toLowerCase().replace(" ", "-") + "-" + (i + 1);
            p.category = categories.get((String) products[i][1]);
            p.price = (double) products[i][2];
            p.compareAtPrice = (Double) products[i][3];
            p.stock = (int) products[i][4];
            p.isFeatured = (boolean) products[i][5];
            p.imageUrl = String.format(IMG, P.get((String) products[i][6]));
            p.description = (String) products[i][7];
            em.persist(p);
            created[i] = p;
        }

        String[][] banners = {
                {"New Season, New Style", "Autumn Collection 2026 is here — discover fresh silhouettes.",
                        "fashion_w", "/shop?category=dresses", "0"},
                {"Up to 40% Off Outerwear", "Cozy up in coats & jackets at seasonal prices.",
                        "coat_m", "/shop?category=jackets-coats", "1"},
                {"Step Into Comfort", "Sneakers and boots designed for every adventure.",
                        "sneakers2", "/shop?category=shoes", "2"},
        };
        for (String[] row : banners) {
            Banner b = new Banner();
            b.title = row[0];
            b.subtitle = row[1];
            b.imageUrl = String.format(WIDE, P.get(row[2]));
            b.linkUrl = row[3];
            b.sortOrder = Integer.parseInt(row[4]);
            em.persist(b);
        }

        String[][] promotions = {
                {"Seasonal Sale — Up to 50% Off", "Limited time on selected styles. While stocks last.",
                        "HOT", "bags", "/shop", "home-main"},
                {"Free Shipping Over ¥80", "Fast, tracked delivery on every order above ¥80.",
                        "SHIPPING", "store", "/shop", "home-strip"},
                {"New Arrivals Just Landed", "Be the first to wear this season's freshest drops.",
                        "NEW", "rack", "/shop?sort=newest", "home-main"},
        };
        for (String[] row : promotions) {
            Promotion promo = new Promotion();
            promo.title = row[0];
            promo.subtitle = row[1];
            promo.badge = row[2];
            promo.imageUrl = String.format(WIDE, P.get(row[3]));
            promo.linkUrl = row[4];
            promo.position = row[5];
            em.persist(promo);
        }

        Object[][] reviews = {
                {3, 5, "Absolutely love this — the quality exceeded my expectations!", "approved"},
                {3, 4, "Beautiful dress, true to size. Shipping was fast too.", "approved"},
                {5, 5, "The coat fits perfectly and looks even better in person.", "approved"},
                {7, 5, "My new favourite jeans. Stretchy but keeps its shape.", "approved"},
                {9, 4, "Great sneakers, very comfortable for daily wear.", "approved"},
                {11, 5, "Roomy tote, fits my laptop and more. Great value.", "approved"},
                {0, 5, "Best basic tee I've owned. Bought it in three colours!", "approved"},
                {4, 4, "Elegant slip dress, got so many compliments.", "pending"},
        };
        for (Object[] row : reviews) {
            Review r = new Review();
            r.product = created[(int) row[0]];
            r.user = demo;
            r.rating = (int) row[1];
            r.comment = (String) row[2];
            r.status = (String) row[3];
            em.persist(r);
        }
    }
}
