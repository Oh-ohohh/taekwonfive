import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  footer,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "success" | "neutral";
  footer?: ReactNode;
}) {
  const toneStyles: Record<string, string> = {
    primary: "bg-primary/7 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-emerald-50 text-emerald-700",
    neutral: "bg-stone-100 text-stone-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-stone-500 sm:text-sm">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-primary tabular-nums sm:text-4xl">{value}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
