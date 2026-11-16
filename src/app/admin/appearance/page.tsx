"use client";

import { applyTheme, getSavedTheme, THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminAppearancePage() {
  const [active, setActive] = useState("aurora");

  useEffect(() => {
    setActive(getSavedTheme());
  }, []);

  const pick = (id: string) => {
    setActive(id);
    applyTheme(id);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-brand-text">
          <Palette className="h-6 w-6 text-primary" /> Appearance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a colour theme for the storefront and admin panel. Changes apply instantly and are saved in this
          browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEMES.map((t) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => pick(t.id)}
              aria-pressed={selected}
              className={cn(
                "group cursor-pointer rounded-2xl border-2 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                selected ? "border-primary ring-2 ring-primary/20" : "border-gray-100 hover:border-gray-200",
              )}
            >
              <div className="rounded-xl p-4" style={{ background: t.page }}>
                <div className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full ring-1 ring-black/5"
                    style={{ background: `linear-gradient(135deg, ${t.brand} 50%, ${t.accent} 50%)` }}
                  />
                  <span className="h-2 w-16 rounded-full" style={{ background: t.brand, opacity: 0.85 }} />
                  <span className="ml-auto h-5 w-12 rounded-full" style={{ background: t.brand }} />
                </div>
                <div className="mt-4 h-2 w-3/4 rounded-full" style={{ background: t.brand, opacity: 0.22 }} />
                <div className="mt-2 h-2 w-1/2 rounded-full" style={{ background: t.accent, opacity: 0.45 }} />
                <div className="mt-4 flex gap-2">
                  <span
                    className="h-7 w-20 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${t.brand}, ${t.accent})` }}
                  />
                  <span
                    className="h-7 w-20 rounded-full border bg-white"
                    style={{ borderColor: t.brand }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between px-1">
                <div className="min-w-0">
                  <p className="font-heading text-sm font-bold text-brand-text">{t.name}</p>
                  <p className="truncate text-[11px] text-gray-400">{t.vibe}</p>
                </div>
                {selected ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-semibold text-primary group-hover:underline">
                    Apply
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 rounded-xl border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500">
        Tip: the same theme switcher is available from the palette button in the admin header, so you can preview
        colours on any admin page.
      </p>
    </div>
  );
}
