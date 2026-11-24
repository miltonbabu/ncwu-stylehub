-- Add 12 more catalog products (tees, dresses, outerwear, denim, shoes, accessories).
-- Safe to re-run: products are matched by slug, variants by (product_id, style, size).

INSERT INTO products (name, slug, description, price, compare_at_price, stock, category_id, image_url, is_featured, is_active)
SELECT v.name, v.slug, v.description, v.price, v.compare_at_price, v.stock, c.id, v.image_url, v.is_featured, TRUE
FROM (VALUES
    ('Black Graphic Cotton Tee', 'black-graphic-cotton-tee-13', 'Heavyweight cotton tee with a subtle front print and relaxed shoulders. Washed for a lived-in feel.', 26.90::double precision, 36.90::double precision, 100, 't-shirts', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=70', FALSE),
    ('Everyday White Crew Tee', 'everyday-white-crew-tee-14', 'A clean crew-neck staple in soft combed cotton. Layer it, tuck it, live in it.', 22.90::double precision, NULL::double precision, 130, 't-shirts', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=70', FALSE),
    ('Scarlet Floral Midi Dress', 'scarlet-floral-midi-dress-15', 'Statement floral midi with a cinched waist and swishy skirt. Made for golden-hour moments.', 64.90::double precision, 84.90::double precision, 36, 'dresses', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=70', TRUE),
    ('White Ruffle Tiered Dress', 'white-ruffle-tiered-dress-16', 'Airy tiered dress with ruffle trims and a smocked back. Breezy from brunch to beach.', 69.90::double precision, NULL::double precision, 30, 'dresses', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=70', FALSE),
    ('Washed Leather Biker Jacket', 'washed-leather-biker-jacket-17', 'Buttery washed leather biker with asymmetric zip and quilted shoulders. An heirloom layer.', 149.90::double precision, 189.90::double precision, 16, 'jackets-coats', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=70', TRUE),
    ('Suede Bomber Jacket', 'suede-bomber-jacket-18', 'Soft suede bomber with ribbed trims and a satin lining. Effortless throw-on outerwear.', 109.90::double precision, 139.90::double precision, 20, 'jackets-coats', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=70', FALSE),
    ('Distressed Straight Jeans', 'distressed-straight-jeans-19', 'Straight-leg rigid denim with hand-finished distressing. Vintage character, modern fit.', 52.90::double precision, 69.90::double precision, 80, 'jeans-pants', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=70', TRUE),
    ('High-Waist Tailored Trousers', 'high-waist-tailored-trousers-20', 'Pleated high-waist trousers with a fluid drape and tapered leg. Desk to dinner in one step.', 49.90::double precision, NULL::double precision, 70, 'jeans-pants', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=70', FALSE),
    ('Minimal White Court Sneakers', 'minimal-white-court-sneakers-21', 'Clean low-profile court sneakers in smooth leather. Minimal by design, versatile by nature.', 72.90::double precision, 92.90::double precision, 65, 'shoes', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=70', TRUE),
    ('Floral Print Heeled Pumps', 'floral-print-heeled-pumps-22', 'Pointed-toe pumps in a hand-painted floral print with a sculpted kitten heel.', 79.90::double precision, 99.90::double precision, 25, 'shoes', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=70', FALSE),
    ('City Canvas Backpack', 'city-canvas-backpack-23', 'Water-resistant canvas backpack with a padded laptop sleeve and anti-theft back pocket.', 46.90::double precision, 62.90::double precision, 50, 'accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=70', TRUE),
    ('Slim Leather Card Wallet', 'slim-leather-card-wallet-24', 'Slim full-grain leather card holder with RFID blocking. Fits front pockets, not attention.', 24.90::double precision, 34.90::double precision, 90, 'accessories', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=70', FALSE)
) AS v(name, slug, description, price, compare_at_price, stock, category_slug, image_url, is_featured)
JOIN categories c ON c.slug = v.category_slug
ON CONFLICT (slug) DO NOTHING;

UPDATE products p SET sizes = CASE c.slug
        WHEN 't-shirts' THEN 'S,M,L,XL'
        WHEN 'dresses' THEN 'S,M,L,XL'
        WHEN 'jackets-coats' THEN 'S,M,L,XL'
        WHEN 'jeans-pants' THEN '28,30,32,34'
        WHEN 'shoes' THEN '38,39,40,41,42'
        ELSE '' END
FROM categories c
WHERE p.category_id = c.id
  AND p.slug IN ('black-graphic-cotton-tee-13', 'everyday-white-crew-tee-14',
                 'scarlet-floral-midi-dress-15', 'white-ruffle-tiered-dress-16',
                 'washed-leather-biker-jacket-17', 'suede-bomber-jacket-18',
                 'distressed-straight-jeans-19', 'high-waist-tailored-trousers-20',
                 'minimal-white-court-sneakers-21', 'floral-print-heeled-pumps-22')
  AND COALESCE(p.sizes, '') = '';

UPDATE products SET cost_price = ROUND((price * 0.4)::numeric, 2)
WHERE slug IN ('black-graphic-cotton-tee-13', 'everyday-white-crew-tee-14',
               'scarlet-floral-midi-dress-15', 'white-ruffle-tiered-dress-16',
               'washed-leather-biker-jacket-17', 'suede-bomber-jacket-18',
               'distressed-straight-jeans-19', 'high-waist-tailored-trousers-20',
               'minimal-white-court-sneakers-21', 'floral-print-heeled-pumps-22',
               'city-canvas-backpack-23', 'slim-leather-card-wallet-24');

INSERT INTO product_variants (product_id, style, size, price, compare_at_price, cost_price, stock, image_url)
SELECT p.id, options.style, sized.option, p.price, p.compare_at_price, p.cost_price,
       (p.stock / (sized.option_count * options.style_count))
           + CASE WHEN ((options.style_position - 1) * sized.option_count + sized.position)
                    <= (p.stock % (sized.option_count * options.style_count)) THEN 1 ELSE 0 END,
       p.image_url
FROM products p
JOIN categories c ON c.id = p.category_id
CROSS JOIN LATERAL (
    SELECT option, position, COUNT(*) OVER () AS option_count
    FROM unnest(string_to_array(COALESCE(p.sizes, ''), ',')) WITH ORDINALITY AS item(option, position)
    WHERE btrim(option) <> ''
) sized
CROSS JOIN LATERAL (
    SELECT style, style_position, COUNT(*) OVER () AS style_count
    FROM unnest(string_to_array(CASE c.slug
        WHEN 't-shirts' THEN 'White,Black' WHEN 'dresses' THEN 'Floral,Black'
        WHEN 'jackets-coats' THEN 'Black,Navy' WHEN 'jeans-pants' THEN 'Blue,Black'
        WHEN 'shoes' THEN 'White,Black' ELSE 'Regular' END, ','))
        WITH ORDINALITY AS item(style, style_position)
) options
WHERE p.slug IN ('black-graphic-cotton-tee-13', 'everyday-white-crew-tee-14',
                 'scarlet-floral-midi-dress-15', 'white-ruffle-tiered-dress-16',
                 'washed-leather-biker-jacket-17', 'suede-bomber-jacket-18',
                 'distressed-straight-jeans-19', 'high-waist-tailored-trousers-20',
                 'minimal-white-court-sneakers-21', 'floral-print-heeled-pumps-22')
ON CONFLICT (product_id, style, size) DO NOTHING;