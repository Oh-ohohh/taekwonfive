"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-primary md:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Shield className="h-6 w-6 text-white" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-white">태권파이브</p>
          <p className="truncate text-xs text-white/60">태권도 출석 관리</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-white text-primary" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
