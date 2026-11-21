export interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin" | "demo_admin";
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  style: string;
  size: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string;
  cost_price?: number | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  category_id: number;
  category_name: string;
  category_slug: string;
  image_url: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  images: ProductImage[];
  avg_rating: number;
  review_count: number;
  /** Comma-separated size options (e.g. "S,M,L,XL" or "38,39,40,41"); empty = no sizes. */
  sizes: string;
  /** Purchase cost per unit. Only returned on admin endpoints — absent in the public catalog. */
  cost_price?: number | null;
  variants: ProductVariant[];
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  product_image: string;
  /** Chosen size for this line; null/empty when the product has no sizes. */
  size: string | null;
  style: string | null;
}

export interface RefundRequest {
  id: number;
  order_id: number;
  order_item_id: number;
  product_name: string;
  quantity: number;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  requested_at: string;
  resolved_at: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  total: number;
  shipping_name: string;
  shipping_address: string;
  shipping_phone: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  /** Shipping fee included in `total` (0 when free). */
  shipping: number;
  tracking_number: string | null;
  /** Last status / tracking change (ISO string). Falls back to created_at on older orders. */
  updated_at?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Promotion {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  link_url: string;
  position: string;
  is_active: boolean;
}

export interface AdminStats {
  products: number;
  users: number;
  orders: number;
  revenue: number;
  pending_reviews: number;
  low_stock: number;
}

/* ---------- Admin analytics (computed server-side from real orders) ---------- */

export interface AnalyticsPoint {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface AnalyticsProduct {
  name: string;
  units: number;
  revenue: number;
  profit: number;
}

export interface AnalyticsTotals {
  revenue: number;
  profit: number;
  avg_order: number;
  orders: number;
  units: number;
}

export interface StatusSlice {
  status: string;
  count: number;
}

export interface AdminAnalytics {
  days: number;
  totals: AnalyticsTotals;
  series: AnalyticsPoint[];
  top_products: AnalyticsProduct[];
  status_counts: StatusSlice[];
  products: number;
  users: number;
  low_stock: number;
  pending_reviews: number;
  subscribers: number;
}

/** NCWU StyleHub Club member (newsletter). */
export interface Subscriber {
  id: number;
  email: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

/** Message sent through the public contact form. */
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthPayload {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CartLine {
  product: Product;
  quantity: number;
  /** Chosen size; "" when the product has no sizes. Same product + different size = separate lines. */
  size: string;
  style: string;
  variant_id: number | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
}
