import Image from "next/image";
import { cn } from "@/lib/utils";

export function PracticumMark({ className }: { className?: string }) {
  return (
    <Image
      src="/practicum-mark-192.png"
      alt=""
      width={36}
      height={36}
      unoptimized
      loading="eager"
      className={cn("size-9 shrink-0", className)}
    />
  );
}

export function PracticumLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5", className)}>
      <PracticumMark />
      <span className="text-[1.0625rem] font-bold tracking-[-0.035em]">PracticumOS</span>
    </span>
  );
}
