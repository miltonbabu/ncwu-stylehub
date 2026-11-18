# NCWU StyleHub — Design System (MASTER)

Generated via ui-ux-pro-max for: e-commerce fashion clothes store.

## Style
- **Style:** Liquid Glass (applied tastefully): flowing gradients, smooth transitions (150-300ms),
  dynamic blur on header/drawers, iridescent accents. Avoid heavy effects (perf warnings).
- **Avoid anti-patterns:** vibrant block-based layouts, playful colors.

## Colors

The palette is **runtime-switchable**: four themes are defined as CSS custom properties and
selected with `<html data-theme="...">`. The React app maps them through Tailwind's
`@theme inline` tokens.

| Theme | Primary | Accent | Page | Ink |
|-------|---------|--------|------|-----|
| **noir** (default) | `#1f1d1b` ink | `#b4553f` terracotta | `#faf8f5` | `#1f1d1b` |
| ocean | `#123a5c` navy | `#c08a3e` brass | `#f5f7f9` | `#14202b` |
| blush | `#6d2f4a` plum | `#c2708a` rose | `#fdf7f9` | `#3b1f2b` |
| forest | `#059669` emerald | `#f97316` orange | `#ecfdf5` | `#064e3b` |

Token names (identical in both frontends): `--brand`, `--brand-dark`, `--brand-soft`,
`--accent`, `--accent-dark`, `--bg` / `--page`, `--surface`, `--ink`, `--tint`, `--gold`.
Tailwind aliases: `primary`, `primary-dark`, `primary-light`, `secondary`, `accent`,
`accent-dark`, `brand-bg`, `brand-soft`, `brand-text`, `brand-tint`, `surface`, `gold`.

A colour picker (4 swatches) sits in the header of both frontends; the choice is saved in
`localStorage` under `stylehub_theme` and applied before first paint.

Neutral scale for surfaces: slate-900 headings on light, slate-600 muted text
(min contrast 4.5:1), borders gray-200 in light mode. Star ratings use `--gold`.

## Typography
- **Headings:** Rubik (300–700)
- **Body:** Nunito Sans (300–700)
- Google Fonts import in `globals.css`.
- Mood: ecommerce, clean, shopping, retail, conversion.

## Effects
- Fluid animations 400-600ms curves for hero transitions; hover states 150-300ms color/shadow
  (never scale-based layout shifts); backdrop blur for sticky header and cart drawer.
- Respect `prefers-reduced-motion`.

## Homepage Section Order (marketplace pattern + required features)
1. Announcement bar (promo strip)
2. Header (logo, nav, search, account, cart)
3. Hero carousel (auto-play 5s, arrows, dots, CTA) — REQUIRED
4. Categories showcase — REQUIRED
5. Featured products — REQUIRED
6. Promotional sections (seasonal sale split banner + coupon strip) — REQUIRED
7. New arrivals / best sellers tabs
8. Trust badges + newsletter
9. Footer

## Rules
- Icons: Lucide SVG only (no emoji icons), 24x24, `w-6 h-6` sizing.
- `cursor-pointer` on all clickable elements; visible focus states.
- Cards: rounded-2xl, shadow-sm hover:shadow-md transitions.
- Responsive check at 375 / 768 / 1024 / 1440px; max-width `max-w-7xl` container.
