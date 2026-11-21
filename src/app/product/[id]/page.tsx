import type { Metadata } from "next";
import { ProductDetailClient } from "./product-detail-client";

const siteUrl = "https://shop.ncwu.site";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type ProductMetadata = { id: number; name: string; description: string; image_url: string };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const response = await fetch(`${apiUrl}/api/v1/products/${encodeURIComponent(id)}`, { next: { revalidate: 300 } });
    if (!response.ok) throw new Error("Product metadata unavailable");
    const product = await response.json() as ProductMetadata;
    const title = `${product.name} | NCWU StyleHub`;
    const description = product.description.slice(0, 200);
    const canonical = `${siteUrl}/product/${encodeURIComponent(id)}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website", siteName: "NCWU StyleHub", title, description, url: canonical,
        images: product.image_url ? [{ url: product.image_url, alt: product.name, width: 1200, height: 1200 }] : [],
      },
      twitter: { card: "summary_large_image", title, description,
        images: product.image_url ? [product.image_url] : [] },
    };
  } catch {
    return { title: "Product | NCWU StyleHub", description: "Shop considered everyday style at NCWU StyleHub." };
  }
}

export default function ProductPage() {
  return <ProductDetailClient />;
}
