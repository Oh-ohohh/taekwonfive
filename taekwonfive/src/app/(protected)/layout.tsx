import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppDataProvider } from "@/context/app-data-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AppShell } from "@/components/layout/app-shell";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !isAdmin(user)) redirect("/login");

  return (
    <AppDataProvider>
      <ToastProvider><AppShell>{children}</AppShell></ToastProvider>
    </AppDataProvider>
  );
}
