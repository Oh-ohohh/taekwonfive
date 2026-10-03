"use client";

import Link from "next/link";
import { DojangMark } from "@/components/layout/dojang-mark";
import { LogoutButton } from "@/components/auth/logout-button";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex flex-col print:hidden md:hidden">
      <div className="flex items-center justify-between gap-2 bg-white pr-3">
        <Link href="/" className="flex items-center gap-2.5 px-4 py-3" aria-label="태권파이브 홈">
          <DojangMark className="h-9 w-9 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-700">태권파이브</p>
            <p className="mt-1 truncate text-[9px] tracking-[0.15em] text-slate-500">TAEKWON FIVE</p>
          </div>
        </Link>
        <LogoutButton />
      </div>
      <span aria-hidden="true" className="dojang-accent-bar h-1 w-full shrink-0" />
    </header>
  );
}
