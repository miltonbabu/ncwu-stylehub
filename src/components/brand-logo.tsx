import { cn } from "@/lib/utils";

export function BrandLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5">
      <img src="/stylehub-mark.svg" alt="" width={40} height={40} className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
      <span className="flex flex-col gap-0.5">
        <span className={cn("text-[9px] font-semibold leading-none tracking-[0.3em]", inverted ? "text-white/65" : "text-primary")}>
          NCWU
        </span>
        <span className={cn("font-heading text-xl font-bold leading-none tracking-[-0.04em] sm:text-2xl", inverted ? "text-white" : "text-brand-text")}>
          StyleHub<span className={inverted ? "text-cyan-300" : "text-primary"}>.</span>
        </span>
      </span>
    </span>
  );
}
