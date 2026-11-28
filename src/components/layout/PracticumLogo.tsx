import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PracticumMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn(
      "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white",
      className,
    )}>
      <ShieldCheck className="size-5" strokeWidth={1.9} />
    </span>
  );
}

export function PracticumLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <PracticumMark />
      <span className="text-base font-bold tracking-tight">PracticumOS</span>
    </span>
  );
}
