"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const EVENT = "stylehub:coming-soon";

/** Show the global "Coming soon" toast. Call from any client component. */
export function showComingSoon(label?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: label ?? "" }));
}

/** Stand-in for a link that is not live yet. Rendering as a button keeps it visible but inert. */
export function ComingSoonLink({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => showComingSoon(label)} title="Coming soon" className={className}>
      {children}
    </button>
  );
}

/** Mounted once in the root layout; renders the toast for unfinished links. */
export function ComingSoonToast() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onShow = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setLabel(detail || "This page");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setLabel(null), 2600);
    };
    window.addEventListener(EVENT, onShow);
    return () => {
      window.removeEventListener(EVENT, onShow);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (label === null) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 lg:bottom-10"
    >
      <div className="flex items-center gap-2.5 rounded-full bg-brand-text px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/25">
        <Sparkles className="h-4 w-4 text-secondary" aria-hidden />
        {label} is coming soon
      </div>
    </div>
  );
}
