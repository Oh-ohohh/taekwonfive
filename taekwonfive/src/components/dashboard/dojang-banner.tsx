import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DojangBanner() {
  return (
    <section className="dojang-hero grid items-center gap-5 overflow-hidden rounded-3xl border border-sky-100 p-5 sm:p-7 xl:grid-cols-2">
      <div className="py-2 sm:px-1">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-accent">A LITTLE STRONGER, EVERY DAY</p>
        <h2 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-slate-700 sm:text-[30px]">함께 웃고, 함께 자라는<br />우리 도장의 하루.</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">오늘도 즐겁게 수련하며 한 뼘 더 성장해요.</p>
        <Link href="/attendance" className="mt-6 inline-flex items-center gap-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
          오늘의 수련 시작하기 <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <Image
        src="/dojang-friends.png"
        alt="밝은 도장에서 도복을 입고 웃으며 하이파이브하는 두 수련생의 수채화 일러스트"
        width={1536}
        height={1024}
        sizes="(min-width: 1536px) 520px, (min-width: 1280px) 40vw, (min-width: 768px) calc(100vw - 400px), calc(100vw - 80px)"
        loading="eager"
        className="mx-auto h-auto w-full max-w-xl rounded-2xl"
      />
    </section>
  );
}
