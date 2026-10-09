"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, getMonthCalendarDates, shiftMonth } from "@/lib/date";
import { getDayOffLabel } from "@/lib/holidays";

export type CalendarDaySummary = {
  attendingCount: number;
  /** 그날 수업 대상 중 출석 비율(%). 수업 대상이 없으면 null. */
  attendanceRate: number | null;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function AttendanceCalendar({
  month,
  summaries,
  onSelectDate,
  onChangeMonth,
}: {
  month: string;
  summaries: Map<string, CalendarDaySummary>;
  onSelectDate: (date: string) => void;
  onChangeMonth: (nextMonth: string) => void;
}) {
  const today = new Date();
  const todayString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(today);
  const { leadingEmptyDays, dates } = getMonthCalendarDates(month);

  return (
    <section className="h-full rounded-2xl border border-stone-200/80 bg-[#fffefa] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-primary">수련 기록</h2>
          <p className="mt-1 text-xs text-stone-500">날짜를 누르면 그날의 출석 체크로 이동합니다.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(month, -1))}
            aria-label="이전 달 보기"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(shiftMonth(month, 1))}
            aria-label="다음 달 보기"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-5 border-t border-stone-100 pt-5 text-center text-lg font-bold tracking-tight text-primary">{formatMonthLabel(month)}</p>

      <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-1.5">
        {WEEKDAYS.map((weekday, index) => (
          <div
            key={weekday}
            className={`pb-1 text-center text-[11px] font-medium ${
              index === 0 ? "text-red-400" : index === 6 ? "text-primary" : "text-slate-400"
            }`}
          >
            {weekday}
          </div>
        ))}

        {Array.from({ length: leadingEmptyDays }, (_, index) => (
          <div key={`empty-${index}`} aria-hidden="true" />
        ))}

        {dates.map((date) => {
          const summary = summaries.get(date);
          const isFuture = date > todayString;
          const isToday = date === todayString;
          const attendanceText = `${summary?.attendingCount ?? 0}명`;
          const dayOffLabel = getDayOffLabel(date);

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={`${date}${dayOffLabel ? `, ${dayOffLabel}` : ""}, ${isFuture ? "미리 출석 체크" : `${attendanceText} 출석${summary ? `, 출석률 ${summary.attendanceRate === null ? "없음" : `${summary.attendanceRate}%`}` : ", 기록 없음"}`}, 출석 체크로 이동`}
              className={`flex min-h-20 min-w-0 flex-col rounded-lg border px-1 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 sm:min-h-24 sm:px-3 ${
                isFuture
                    ? "border-transparent bg-stone-100/70 text-stone-400 hover:border-accent/30 hover:bg-accent/5"
                    : "border-stone-200/70 bg-white text-stone-700 hover:border-accent/40 hover:bg-accent/5"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  isToday ? "bg-primary/10 text-primary" : dayOffLabel && !isFuture ? "text-rose-500" : ""
                }`}
              >
                {Number(date.slice(-2))}
              </span>
              {dayOffLabel && (
                <span className={`mt-0.5 w-full truncate text-[9px] font-semibold leading-3 sm:text-[10px] ${isFuture ? "text-rose-300" : "text-rose-500"}`}>
                  {dayOffLabel}
                </span>
              )}
              {!isFuture && (
                <>
                  <span className={`mt-auto text-[10px] font-semibold leading-3 sm:text-xs text-slate-700`}>
                    {attendanceText}
                  </span>
                  <span className={`mt-0.5 text-[9px] leading-3 sm:text-[10px] text-slate-400`}>
                    {!summary ? "미기록" : summary.attendanceRate === null ? "-" : <><span className="hidden sm:inline">출석률 </span>{summary.attendanceRate}%</>}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>휴관·수업 없는 요일·휴일(주말·공휴일)은 결석으로 자동 집계하지 않습니다.</span>
        <span>미래 날짜도 눌러서 미리 출석 체크할 수 있습니다.</span>
      </div>
    </section>
  );
}
