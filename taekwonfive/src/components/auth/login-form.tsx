"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { login } from "@/app/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="username" className="text-sm font-semibold text-slate-700">아이디</label>
        <div className="relative mt-2">
          <UserRound aria-hidden="true" className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={100} placeholder="관리자 아이디" aria-describedby={state.error ? "login-error" : undefined} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-slate-700">비밀번호</label>
        <div className="relative mt-2">
          <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={256} placeholder="비밀번호 입력" aria-describedby={state.error ? "login-error" : undefined} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} className="absolute right-1.5 top-1.5 rounded-lg p-2 text-slate-400 hover:text-primary">
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {state.error && <p id="login-error" role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "로그인 중…" : "로그인"}
      </button>
      <p className="text-center text-xs leading-relaxed text-slate-500">도장 관리자 전용 공간입니다.</p>
    </form>
  );
}
