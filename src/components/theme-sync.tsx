"use client";

import { applyTheme, getSavedTheme } from "@/lib/themes";
import { useEffect } from "react";

export function ThemeSync() {
  useEffect(() => {
    const sync = (event: Event) => {
      const id = event instanceof StorageEvent ? event.newValue : (event as CustomEvent<string>).detail;
      if (!id) return;
      if (event.type === "stylehub-theme-change") {
        document.documentElement.setAttribute("data-theme", id);
      } else {
        applyTheme(id);
      }
    };

    window.addEventListener("storage", sync);
    window.addEventListener("stylehub-theme-change", sync);
    document.documentElement.setAttribute("data-theme", getSavedTheme());

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("stylehub-theme-change", sync);
    };
  }, []);

  return null;
}
