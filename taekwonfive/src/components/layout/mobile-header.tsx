"use client";

import { Shield } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b border-slate-200 bg-primary px-4 py-3 md:hidden">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Shield className="h-5 w-5 text-white" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-white">태권파이브</p>
        <p className="truncate text-[11px] leading-tight text-white/60">태권도 출석 관리</p>
      </div>
    </header>
  );
}
