"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { DojangMark } from "@/components/layout/dojang-mark";
import { LogoutButton } from "@/components/auth/logout-button";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sky-100 bg-white text-slate-700 print:hidden md:flex">
      <span aria-hidden="true" className="dojang-accent-bar h-1 w-full shrink-0" />
      <Link href="/" className="flex items-center gap-3 px-7 py-9" aria-label="태권파이브 홈">
        <DojangMark className="h-11 w-11 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-tight">태권파이브<span className="text-accent">.</span></p>
          <p className="mt-1 text-[9px] font-medium tracking-[0.2em] text-slate-500">TAEKWON FIVE</p>
        </div>
      </Link>

      <p className="px-7 pb-3 pt-5 text-[10px] font-medium tracking-[0.18em] text-slate-400">DOJANG MANAGEMENT</p>
      <nav aria-label="주 메뉴" className="flex flex-col gap-2 px-4 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-3.5 text-sm font-medium transition-colors ${
                active ? "bg-sky-100/80 text-primary" : "text-slate-500 hover:bg-sky-50 hover:text-primary"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
              {label}
              {active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>
      <div className="mx-5 mb-3 mt-auto flex items-center justify-between border-t border-sky-100 pt-4">
        <span className="text-xs font-semibold text-slate-500">관리자 · admin</span>
        <LogoutButton />
      </div>
      <div className="mx-5 mb-6 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 p-5">
        <p className="text-[10px] tracking-[0.2em] text-accent">THE FIVE TENETS</p>
        <p className="mt-3 text-sm font-semibold tracking-widest text-slate-600">예의 · 염치 · 인내<br /><span className="mt-1.5 inline-block">극기 · 백절불굴</span></p>
        <div className="mt-7 flex items-center justify-between text-[10px] text-slate-500">
          <span>매일의 수련, 함께하는 성장</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
