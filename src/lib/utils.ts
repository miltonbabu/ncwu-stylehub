export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const PAYMENT_LABELS: Record<string, string> = {
  alipay: "Alipay",
  wechat: "WeChat Pay",
  cod: "Cash on Delivery",
  card: "Credit / Debit Card",
  paypal: "PayPal",
};

export function paymentLabel(id: string): string {
  return PAYMENT_LABELS[id] ?? id.replace(/-/g, " ");
}

export const FREE_SHIPPING_THRESHOLD = 80;

export function shippingFor(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 6.9;
}

/** Image fallback chain: product/CDN image -> deterministic placeholder. */
export function imgFallback(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/1100`;
}

/**
 * Build an optimized Cloudinary delivery URL by injecting a transformation
 * component right after `/upload/` (per Cloudinary docs: f_auto/q_auto as a
 * separate component auto-picks WebP/AVIF and the right quality). Non-Cloudinary
 * URLs (local /uploads/, external placeholders) are returned unchanged.
 */
export function cloudinaryImg(
  src: string | null | undefined,
  opts: { width?: number; height?: number } = {},
): string {
  if (!src) return "";
  const uploadAt = src.indexOf("/upload/");
  if (uploadAt === -1) return src;

  const parts: string[] = ["f_auto", "q_auto"];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`);
  if (opts.width && opts.height) parts.push("c_fill", "g_auto");
  const transform = parts.join(",");

  const head = src.slice(0, uploadAt + "/upload/".length);
  const tail = src.slice(uploadAt + "/upload/".length);
  return `${head}${transform}/${tail}`;
}
