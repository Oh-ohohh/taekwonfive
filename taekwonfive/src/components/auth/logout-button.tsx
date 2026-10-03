"use client";

import { useActionState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  const [state, action, pending] = useActionState(logout, { error: "" });
  return (
    <form action={action}>
      <button disabled={pending} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-sky-50 hover:text-primary disabled:opacity-50">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        {pending ? "로그아웃 중" : "로그아웃"}
      </button>
      {state.error && <p role="alert" className="mt-1 max-w-44 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
