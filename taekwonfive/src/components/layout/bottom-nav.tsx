"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="모바일 주 메뉴" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-stone-200 bg-[#fffefa] pb-[env(safe-area-inset-bottom)] print:hidden md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 border-t-2 py-3 text-xs font-medium ${
              active ? "border-accent bg-accent/5 text-primary" : "border-transparent text-stone-500"
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? "text-accent" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
