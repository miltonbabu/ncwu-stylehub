"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type ProfitPoint = {
  key: string;
  /** short axis label, e.g. "12 Nov" */
  label: string;
  /** longer tooltip label, e.g. "Wed, 12 Nov" */
  fullLabel: string;
  revenue: number;
  profit: number;
  orders: number;
};

const HEIGHT = 340;
const PAD = { top: 20, right: 20, bottom: 34, left: 62 };

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const step = value / base;
  const nice = step <= 1 ? 1 : step <= 2 ? 2 : step <= 2.5 ? 2.5 : step <= 5 ? 5 : 10;
  return nice * base;
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `¥${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `¥${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return `¥${Math.round(value)}`;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  const t = 0.18;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function ProfitChart({ points, className }: { points: ProfitPoint[]; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { maxY, plotW, plotH, coords, revPath, profPath, areaPath } = useMemo(() => {
    const plotW = Math.max(width - PAD.left - PAD.right, 10);
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const peak = Math.max(...points.map((p) => Math.max(p.revenue, p.profit)), 0);
    const maxY = niceMax(peak * 1.12 || 100);

    const coords = points.map((p, i) => {
      const x = points.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (points.length - 1)) * plotW;
      const ry = PAD.top + plotH - (p.revenue / maxY) * plotH;
      const py = PAD.top + plotH - (p.profit / maxY) * plotH;
      return { x, ry, py };
    });

    const revPts = coords.map((c) => ({ x: c.x, y: c.ry }));
    const profPts = coords.map((c) => ({ x: c.x, y: c.py }));
    const revPath = smoothPath(revPts);
    const profPath = smoothPath(profPts);
    const baseline = PAD.top + plotH;
    const areaPath = revPts.length
      ? `${revPath} L ${revPts[revPts.length - 1].x} ${baseline} L ${revPts[0].x} ${baseline} Z`
      : "";

    return { maxY, plotW, plotH, coords, revPath, profPath, areaPath };
  }, [points, width]);

  const onMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (points.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = (x - PAD.left) / Math.max(plotW, 1);
      const idx = Math.round(ratio * (points.length - 1));
      setHover(Math.max(0, Math.min(points.length - 1, idx)));
    },
    [points.length, plotW],
  );

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const active = hover !== null ? points[hover] : null;
  const activeCoord = hover !== null ? coords[hover] : null;

  // Tooltip should flip to the left near the right edge so it never overflows.
  const tooltipLeft = activeCoord ? Math.min(Math.max(activeCoord.x + 14, 8), Math.max(width - 176, 8)) : 0;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Revenue and estimated profit over time"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block overflow-visible"
      >
        <defs>
          <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
            <stop offset="70%" stopColor="var(--brand)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>

        {/* horizontal grid + y labels */}
        {ticks.map((t) => {
          const y = PAD.top + plotH - t * plotH;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + plotW}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
                className="text-gray-100"
                strokeDasharray={t === 0 ? undefined : "4 5"}
              />
              <text
                x={PAD.left - 12}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400"
                style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}
              >
                {compactMoney(t * maxY)}
              </text>
            </g>
          );
        })}

        {/* x labels — thinned out so they never collide */}
        {points.map((p, i) => {
          const showEvery = Math.ceil(points.length / (width < 480 ? 4 : 8));
          if (i % showEvery !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={p.key}
              x={coords[i].x}
              y={HEIGHT - 12}
              textAnchor="middle"
              className="fill-gray-400"
              style={{ fontSize: 11 }}
            >
              {p.label}
            </text>
          );
        })}

        {areaPath && <path d={areaPath} fill={`url(#area-${uid})`} />}

        <path
          d={revPath}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={profPath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="6 5"
          strokeLinecap="round"
          opacity={0.85}
        />

        {/* hover guide */}
        {activeCoord && (
          <g>
            <line
              x1={activeCoord.x}
              y1={PAD.top}
              x2={activeCoord.x}
              y2={PAD.top + plotH}
              stroke="var(--brand)"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.45}
            />
            <circle cx={activeCoord.x} cy={activeCoord.ry} r={5.5} fill="var(--brand)" stroke="#fff" strokeWidth={2} />
            <circle cx={activeCoord.x} cy={activeCoord.py} r={4.5} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border border-gray-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
          style={{ left: tooltipLeft }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{active.fullLabel}</p>
          <p className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} /> Revenue
            </span>
            <span className="font-semibold tabular-nums text-brand-text">¥{active.revenue.toFixed(2)}</span>
          </p>
          <p className="mt-1 flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} /> Profit
            </span>
            <span className="font-semibold tabular-nums text-brand-text">¥{active.profit.toFixed(2)}</span>
          </p>
          <p className="mt-1 flex items-center justify-between gap-2 border-t border-gray-100 pt-1 text-xs">
            <span className="text-gray-500">Orders</span>
            <span className="font-semibold tabular-nums text-brand-text">{active.orders}</span>
          </p>
        </div>
      )}
    </div>
  );
}
