import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { DojangMark } from "@/components/layout/dojang-mark";
import { isAdmin, safeReturnPath } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export const metadata = { title: "관리자 로그인 | 태권파이브" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeReturnPath(params.next);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (isAdmin(user)) redirect(next);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8 sm:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl shadow-sky-900/5 lg:grid-cols-2">
        <section className="dojang-hero hidden flex-col justify-center p-10 lg:flex">
          <p className="text-xs font-bold tracking-[0.2em] text-accent">GROWING TOGETHER</p>
          <h1 className="mt-4 text-3xl font-bold leading-snug tracking-tight text-slate-700">함께 웃고, 함께 자라는<br />우리 도장의 하루.</h1>
          <p className="mt-3 text-sm text-slate-600">수련생의 오늘을 살피는 따뜻한 시작.</p>
          <Image src="/dojang-friends.png" alt="도복을 입고 즐겁게 하이파이브하는 수련생들" width={1536} height={1024} sizes="450px" className="mt-8 h-auto w-full rounded-2xl" />
        </section>
        <section className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="flex items-center gap-3 text-primary">
            <DojangMark className="h-11 w-11" />
            <div><p className="text-lg font-bold">태권파이브</p><p className="mt-0.5 text-[9px] tracking-[0.2em]">TAEKWON FIVE</p></div>
          </div>
          <h2 className="mt-9 text-2xl font-bold tracking-tight text-slate-800">관리자 로그인</h2>
          <p className="mt-2 text-sm text-slate-500">로그인하고 오늘의 수련을 준비하세요.</p>
          <LoginForm next={next} />
        </section>
      </div>
    </main>
  );
}
