import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <MobileHeader />
        <main className="flex-1 overflow-x-hidden px-4 py-5 pb-24 sm:px-6 sm:py-6 md:pb-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
