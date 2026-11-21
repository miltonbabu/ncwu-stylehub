export type ThemeDef = {
  id: string;
  name: string;
  vibe: string;
  brand: string;
  accent: string;
  page: string;
};

export const THEME_STORAGE_KEY = "stylehub_theme";
export const DEFAULT_THEME = "aurora";

export const THEMES: ThemeDef[] = [
  {
    id: "aurora",
    name: "Aurora",
    vibe: "Violet + cyan — bold and modern",
    brand: "#6d28d9",
    accent: "#06b6d4",
    page: "#f7f5ff",
  },
  {
    id: "sunset",
    name: "Sunset",
    vibe: "Orange + hot pink — high energy",
    brand: "#ea580c",
    accent: "#db2777",
    page: "#fff7ed",
  },
  {
    id: "emerald",
    name: "Emerald",
    vibe: "Fresh green + lime — clean and calm",
    brand: "#059669",
    accent: "#84cc16",
    page: "#f0fdf9",
  },
  {
    id: "ocean",
    name: "Ocean",
    vibe: "Sky blue + indigo — crisp and trustworthy",
    brand: "#0284c7",
    accent: "#4f46e5",
    page: "#f0f9ff",
  },
  {
    id: "candy",
    name: "Candy",
    vibe: "Fuchsia + violet — playful pop",
    brand: "#db2777",
    accent: "#8b5cf6",
    page: "#fdf4ff",
  },
  {
    id: "royal",
    name: "Royal",
    vibe: "Indigo + amber — premium contrast",
    brand: "#4338ca",
    accent: "#d97706",
    page: "#f5f6ff",
  },
  {
    id: "citrus",
    name: "Citrus",
    vibe: "Olive + amber — warm and lively",
    brand: "#4d7c0f",
    accent: "#f59e0b",
    page: "#f7fee7",
  },
  {
    id: "noir",
    name: "Noir",
    vibe: "Ink + orange — minimal street style",
    brand: "#18181b",
    accent: "#f97316",
    page: "#fafafa",
  },
];

export function getSavedTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.some((t) => t.id === saved) ? (saved as string) : DEFAULT_THEME;
}

export function applyTheme(id: string) {
  const root = document.documentElement;
  // Disable transitions for the single frame that swaps CSS variables, so switching
  // themes is instant instead of animating every coloured element on the page.
  root.classList.add("theme-switching");
  root.setAttribute("data-theme", id);
  void root.offsetHeight; // force one synchronous style flush
  requestAnimationFrame(() => root.classList.remove("theme-switching"));
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("stylehub-theme-change", { detail: id }));
  } catch {
    /* storage can be blocked in private mode — theme still applies for this visit */
  }
}
