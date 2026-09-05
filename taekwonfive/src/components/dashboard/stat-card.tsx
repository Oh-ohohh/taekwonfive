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
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-emerald-100 text-emerald-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}
