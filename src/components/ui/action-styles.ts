import { cn } from "@/lib/utils";

const variants = {
  primary: "border-emerald-700 bg-emerald-700 text-white hover:border-emerald-800 hover:bg-emerald-800",
  secondary: "border-slate-300 bg-white text-slate-800 hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900",
  danger: "border-red-200 bg-white text-red-800 hover:border-red-500 hover:bg-red-50",
};

export function actionStyle(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold leading-5 transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  );
}

export const formControlStyle =
  "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline focus:outline-1 focus:outline-emerald-700 read-only:bg-slate-50";
