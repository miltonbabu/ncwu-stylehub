"use client";

import { cn } from "@/lib/utils";
import { applyTheme, getSavedTheme, THEMES } from "@/lib/themes";
import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ThemePicker() {
  const [theme, setTheme] = useState("aurora");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id: string) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Colour theme: ${active.name}`}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-2 pr-3 text-xs font-semibold text-brand-text transition-colors duration-200 hover:border-primary"
      >
        <span
          className="h-5 w-5 rounded-full"
          style={{ background: `linear-gradient(135deg, ${active.brand} 50%, ${active.accent} 50%)` }}
        />
        <span className="hidden sm:inline">{active.name}</span>
        <Palette className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Store theme
          </p>
          <div className="max-h-80 overflow-y-auto">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 hover:bg-brand-soft",
                  theme === t.id && "bg-brand-soft",
                )}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-full ring-1 ring-black/5"
                  style={{ background: `linear-gradient(135deg, ${t.brand} 45%, ${t.accent} 55%)` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-text">{t.name}</span>
                  <span className="block truncate text-[11px] text-gray-400">{t.vibe}</span>
                </span>
                {theme === t.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
