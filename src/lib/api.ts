import type { AdminAnalytics, AuthPayload, ContactMessage, Order, Product, Subscriber, User } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const TOKEN_KEY = "stylehub_token";
const USER_KEY = "stylehub_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function storeAuth(payload: AuthPayload) {
  localStorage.setItem(TOKEN_KEY, payload.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isForm = options.body instanceof FormData;
  if (!headers.has("Content-Type") && options.body && !isForm) {
    headers.set("Content-Type", "application/json");
  }
  const isAuthPath = AUTH_PATHS.includes(path);
  const token = isAuthPath ? null : getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });

  // An expired/invalid token (or one signed by a different SECRET_KEY) must not
  // leave the user stuck on an error screen — drop it and restart the sign-in flow.
  if (res.status === 401 && token) {
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/sign-in?next=${next}`;
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      /* keep default message */
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/* ---------- Wishlist ---------- */

export function fetchWishlist(): Promise<Product[]> {
  return api<Product[]>("/wishlist");
}

export function addWishlist(productId: number): Promise<void> {
  return api<void>(`/wishlist/${productId}`, { method: "POST" });
}

export function removeWishlist(productId: number): Promise<void> {
  return api<void>(`/wishlist/${productId}`, { method: "DELETE" });
}

/* ---------- Admin orders ---------- */

export function updateAdminOrder(
  id: number,
  update: { status: string; tracking_number: string },
): Promise<Order> {
  return api<Order>(`/admin/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });
}

/* ---------- Admin ---------- */

export function fetchAdminAnalytics(days: number): Promise<AdminAnalytics> {
  return api<AdminAnalytics>(`/admin/analytics?days=${days}`);
}

export function createAdminUser(payload: {
  name: string;
  email: string;
  password: string;
  role: "customer" | "admin";
}): Promise<User> {
  return api<User>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

/* ---------- NCWU StyleHub Club ---------- */

export function subscribeToClub(email: string): Promise<Subscriber> {
  return api<Subscriber>("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
}

export function fetchSubscribers(): Promise<Subscriber[]> {
  return api<Subscriber[]>("/admin/newsletter");
}

export function deleteSubscriber(id: number): Promise<void> {
  return api<void>(`/admin/newsletter/${id}`, { method: "DELETE" });
}

/* ---------- Contact ---------- */

export function sendContactMessage(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  return api<ContactMessage>("/contact", { method: "POST", body: JSON.stringify(payload) });
}

export function fetchContactMessages(): Promise<ContactMessage[]> {
  return api<ContactMessage[]>("/admin/contact-messages");
}

export function markContactMessageRead(id: number): Promise<void> {
  return api<void>(`/admin/contact-messages/${id}/read`, { method: "PATCH" });
}

export function deleteContactMessage(id: number): Promise<void> {
  return api<void>(`/admin/contact-messages/${id}`, { method: "DELETE" });
}

/* ---------- Orders (customer) ---------- */

export function cancelOrder(id: number): Promise<Order> {
  return api<Order>(`/orders/${id}/cancel`, { method: "POST" });
}

/* ---------- Password reset (all handled by the backend) ---------- */

export function requestPasswordReset(email: string): Promise<void> {
  return api<void>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return api<void>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
}
