import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="dojang-surface min-h-screen print:block print:min-h-0 print:bg-white md:flex">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col print:block print:min-h-0 md:pl-64">
        <MobileHeader />
        <main className="flex-1 px-4 py-6 pb-24 print:p-0 sm:px-7 sm:py-8 md:pb-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl print:max-w-none">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
