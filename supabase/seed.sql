-- ============================================================
-- NCWU StyleHub - seed data (mirrors java-backend SeedRunner.java)
-- One-time seed for a fresh database. Do NOT re-run on a live DB.
-- Demo logins: admin@shop.ncwu.site / admin@123
--              user@shop.ncwu.site  / demo@123
-- ============================================================

BEGIN;

-- Users (PBKDF2-HMAC-SHA256, 100k iters, saltHex$hashHex — same as PasswordHasher.java)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
(1, 'Store Admin', 'admin@shop.ncwu.site', '51fbb687446edf51b6a0e2673336a5f7$30c6c03994b847fe7eb5e368df7e2f6fcbb0ec99e9811395fd35287272ab54d4', 'admin', TRUE),
(2, 'Demo Customer', 'user@shop.ncwu.site', 'd029f5d5c11620c2f9a33850943fff97$82902306d73e4a900acb7022cdccff4e00f9d2343f928a46f97c349c9838bd5b', 'customer', TRUE);

-- Categories
INSERT INTO categories (id, name, slug, description, image_url, sort_order) VALUES
(1, 'T-Shirts', 't-shirts', 'Soft cotton essentials and statement tees for every day.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=70', 0),
(2, 'Dresses', 'dresses', 'From casual day dresses to elegant evening styles.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=70', 1),
(3, 'Jackets & Coats', 'jackets-coats', 'Outerwear that keeps you warm and stylish.', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=70', 2),
(4, 'Jeans & Pants', 'jeans-pants', 'Denim classics and tailored fits.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=70', 3),
(5, 'Shoes', 'shoes', 'Sneakers, boots and loafers to complete the look.', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=70', 4),
(6, 'Accessories', 'accessories', 'Bags, scarves, hats and finishing touches.', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=70', 5);

-- Products
INSERT INTO products (id, name, slug, description, price, compare_at_price, stock, category_id, image_url, is_featured, is_active) VALUES
(1, 'Classic White Cotton Tee', 'classic-white-cotton-tee-1', 'Our signature crew-neck tee in 100% organic cotton. Pre-shrunk, breathable and endlessly versatile.', 24.90, 34.90, 120, 1, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(2, 'Oversized Street Graphic Tee', 'oversized-street-graphic-tee-2', 'Relaxed oversized fit with a bold back graphic. Perfect with jeans or layered under a jacket.', 29.90, NULL, 85, 1, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(3, 'Ribbed Fitted Long Sleeve', 'ribbed-fitted-long-sleeve-3', 'Stretch ribbed knit that hugs in all the right places. A wardrobe staple for cooler days.', 27.90, 37.90, 95, 1, 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(4, 'Floral Summer Midi Dress', 'floral-summer-midi-dress-4', 'Flowy midi dress with a ditsy floral print, smocked bodice and adjustable straps.', 59.90, 79.90, 40, 2, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(5, 'Satin Evening Slip Dress', 'satin-evening-slip-dress-5', 'Lustrous satin slip dress with a cowl neckline. Dress it up with heels for any occasion.', 74.90, NULL, 28, 2, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(6, 'Denim Trench Coat', 'denim-trench-coat-6', 'Washed denim trench with a belted waist and storm flap. An instant outfit-maker.', 99.90, 129.90, 22, 3, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(7, 'Wool Blend Overcoat', 'wool-blend-overcoat-7', 'Tailored wool-blend overcoat with notch lapels and deep pockets. Timeless elegance.', 129.90, 159.90, 18, 3, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(8, 'Classic Slim Jeans', 'classic-slim-jeans-8', 'Slim-fit stretch denim in a mid-blue wash. Comfort that holds its shape all day.', 49.90, 64.90, 110, 4, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(9, 'High-Rise Wide Leg Trousers', 'high-rise-wide-leg-trousers-9', 'Fluid wide-leg trousers with a flattering high rise. Office to evening, effortless.', 54.90, NULL, 60, 4, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(10, 'Retro Runner Sneakers', 'retro-runner-sneakers-10', 'Cushioned retro runners with a suede-and-mesh upper. All-day comfort, iconic style.', 69.90, 89.90, 75, 5, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(11, 'Court Classic Low Tops', 'court-classic-low-tops-11', 'Clean leather low-tops with a gum sole. The sneakers that go with literally everything.', 64.90, NULL, 90, 5, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(12, 'Everyday Leather Tote', 'everyday-leather-tote-12', 'Structured vegan-leather tote with a zip pocket and laptop sleeve. Work-ready and chic.', 44.90, 59.90, 55, 6, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(13, 'Black Graphic Cotton Tee', 'black-graphic-cotton-tee-13', 'Heavyweight cotton tee with a subtle front print and relaxed shoulders. Washed for a lived-in feel.', 26.90, 36.90, 100, 1, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(14, 'Everyday White Crew Tee', 'everyday-white-crew-tee-14', 'A clean crew-neck staple in soft combed cotton. Layer it, tuck it, live in it.', 22.90, NULL, 130, 1, 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(15, 'Scarlet Floral Midi Dress', 'scarlet-floral-midi-dress-15', 'Statement floral midi with a cinched waist and swishy skirt. Made for golden-hour moments.', 64.90, 84.90, 36, 2, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(16, 'White Ruffle Tiered Dress', 'white-ruffle-tiered-dress-16', 'Airy tiered dress with ruffle trims and a smocked back. Breezy from brunch to beach.', 69.90, NULL, 30, 2, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(17, 'Washed Leather Biker Jacket', 'washed-leather-biker-jacket-17', 'Buttery washed leather biker with asymmetric zip and quilted shoulders. An heirloom layer.', 149.90, 189.90, 16, 3, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(18, 'Suede Bomber Jacket', 'suede-bomber-jacket-18', 'Soft suede bomber with ribbed trims and a satin lining. Effortless throw-on outerwear.', 109.90, 139.90, 20, 3, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(19, 'Distressed Straight Jeans', 'distressed-straight-jeans-19', 'Straight-leg rigid denim with hand-finished distressing. Vintage character, modern fit.', 52.90, 69.90, 80, 4, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(20, 'High-Waist Tailored Trousers', 'high-waist-tailored-trousers-20', 'Pleated high-waist trousers with a fluid drape and tapered leg. Desk to dinner in one step.', 49.90, NULL, 70, 4, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(21, 'Minimal White Court Sneakers', 'minimal-white-court-sneakers-21', 'Clean low-profile court sneakers in smooth leather. Minimal by design, versatile by nature.', 72.90, 92.90, 65, 5, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(22, 'Floral Print Heeled Pumps', 'floral-print-heeled-pumps-22', 'Pointed-toe pumps in a hand-painted floral print with a sculpted kitten heel.', 79.90, 99.90, 25, 5, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=70', FALSE, TRUE),
(23, 'City Canvas Backpack', 'city-canvas-backpack-23', 'Water-resistant canvas backpack with a padded laptop sleeve and anti-theft back pocket.', 46.90, 62.90, 50, 6, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=70', TRUE, TRUE),
(24, 'Slim Leather Card Wallet', 'slim-leather-card-wallet-24', 'Slim full-grain leather card holder with RFID blocking. Fits front pockets, not attention.', 24.90, 34.90, 90, 6, 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=70', FALSE, TRUE);

UPDATE products SET sizes = CASE category_id
    WHEN 1 THEN 'S,M,L,XL' WHEN 2 THEN 'S,M,L,XL' WHEN 3 THEN 'S,M,L,XL'
    WHEN 4 THEN '28,30,32,34' WHEN 5 THEN '38,39,40,41,42' ELSE '' END
WHERE category_id BETWEEN 1 AND 5;

-- Demo sourcing costs make the seeded gross-margin charts illustrative, not real accounting data.
UPDATE products SET cost_price = ROUND((price * 0.4)::numeric, 2);

INSERT INTO product_variants (product_id, style, size, price, compare_at_price, cost_price, stock, image_url)
SELECT p.id, styles.style_name, sizes.size_name, p.price, p.compare_at_price, p.cost_price,
       (p.stock / (sizes.size_count * styles.style_count))
           + CASE WHEN ((styles.style_position - 1) * sizes.size_count + sizes.size_position)
                    <= (p.stock % (sizes.size_count * styles.style_count)) THEN 1 ELSE 0 END,
       p.image_url
FROM products p
CROSS JOIN LATERAL (
    SELECT v.size_name, v.size_position, COUNT(*) OVER () AS size_count
    FROM unnest(string_to_array(COALESCE(p.sizes, ''), ',')) WITH ORDINALITY AS v(size_name, size_position)
    WHERE btrim(v.size_name) <> ''
) sizes
CROSS JOIN LATERAL (
    SELECT v.style_name, v.style_position, COUNT(*) OVER () AS style_count
    FROM unnest(string_to_array(CASE p.category_id
        WHEN 1 THEN 'White,Black' WHEN 2 THEN 'Floral,Black' WHEN 3 THEN 'Black,Navy'
        WHEN 4 THEN 'Blue,Black' WHEN 5 THEN 'White,Black' ELSE 'Regular' END, ','))
        WITH ORDINALITY AS v(style_name, style_position)
) styles;

-- Banners
INSERT INTO banners (id, title, subtitle, image_url, link_url, sort_order, is_active) VALUES
(1, 'New Season, New Style', 'Autumn Collection 2026 is here — discover fresh silhouettes.', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=70', '/shop?category=dresses', 0, TRUE),
(2, 'Up to 40% Off Outerwear', 'Cozy up in coats & jackets at seasonal prices.', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1600&q=70', '/shop?category=jackets-coats', 1, TRUE),
(3, 'Step Into Comfort', 'Sneakers and boots designed for every adventure.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1600&q=70', '/shop?category=shoes', 2, TRUE);

-- Promotions
INSERT INTO promotions (id, title, subtitle, badge, image_url, link_url, position, is_active) VALUES
(1, 'Seasonal Sale — Up to 50% Off', 'Limited time on selected styles. While stocks last.', 'HOT', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=70', '/shop', 'home-main', TRUE),
(2, 'Free Shipping Over ¥80', 'Fast, tracked delivery on every order above ¥80.', 'SHIPPING', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=70', '/shop', 'home-strip', TRUE),
(3, 'New Arrivals Just Landed', 'Be the first to wear this season''s freshest drops.', 'NEW', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1600&q=70', '/shop?sort=newest', 'home-main', TRUE);

-- Reviews (all by demo customer, same as SeedRunner)
INSERT INTO reviews (id, product_id, user_id, rating, comment, status) VALUES
(1, 4, 2, 5, 'Absolutely love this — the quality exceeded my expectations!', 'approved'),
(2, 4, 2, 4, 'Beautiful dress, true to size. Shipping was fast too.', 'approved'),
(3, 6, 2, 5, 'The coat fits perfectly and looks even better in person.', 'approved'),
(4, 8, 2, 5, 'My new favourite jeans. Stretchy but keeps its shape.', 'approved'),
(5, 10, 2, 4, 'Great sneakers, very comfortable for daily wear.', 'approved'),
(6, 12, 2, 5, 'Roomy tote, fits my laptop and more. Great value.', 'approved'),
(7, 1, 2, 5, 'Best basic tee I''ve owned. Bought it in three colours!', 'approved'),
(8, 5, 2, 4, 'Elegant slip dress, got so many compliments.', 'pending');

-- Keep sequences in sync after explicit-id inserts
SELECT setval('users_id_seq',      (SELECT MAX(id) FROM users));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('products_id_seq',   (SELECT MAX(id) FROM products));
SELECT setval('reviews_id_seq',    (SELECT MAX(id) FROM reviews));
SELECT setval('banners_id_seq',    (SELECT MAX(id) FROM banners));
SELECT setval('promotions_id_seq', (SELECT MAX(id) FROM promotions));

COMMIT;
