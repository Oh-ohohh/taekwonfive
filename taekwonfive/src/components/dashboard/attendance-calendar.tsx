"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthLabel, getKoreaMonthString, getMonthCalendarDates, shiftMonth } from "@/lib/date";

export type CalendarDaySummary = {
  attendingCount: number;
  recordedCount: number;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function AttendanceCalendar({
  month,
  selectedDate,
  summaries,
  onSelectDate,
  onChangeMonth,
}: {
  month: string;
  selectedDate: string;
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
  const currentMonth = getKoreaMonthString(today);
  const { leadingEmptyDays, dates } = getMonthCalendarDates(month);
  const canGoForward = month < currentMonth;

  return (
    <section className="h-full rounded-2xl border border-stone-200/80 bg-[#fffefa] p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-primary">수련 기록</h2>
          <p className="mt-1 text-xs text-stone-500">날짜별 실제 출석 인원을 확인하세요.</p>
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
            disabled={!canGoForward}
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
          const isSelected = date === selectedDate;
          const isToday = date === todayString;
          const attendanceText = `${summary?.attendingCount ?? 0}명`;

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              aria-label={`${date}, ${attendanceText} 출석${summary?.recordedCount ? `, ${summary.recordedCount}명 처리됨` : ", 기록 없음"}`}
              className={`flex min-h-20 min-w-0 flex-col rounded-lg border px-1 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 sm:min-h-24 sm:px-3 ${
                isSelected
                  ? "border-accent bg-accent text-white shadow-sm"
                  : isFuture
                    ? "cursor-not-allowed border-transparent bg-stone-100/70 text-stone-300"
                    : "border-stone-200/70 bg-white text-stone-700 hover:border-accent/40 hover:bg-accent/5"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  isToday && !isSelected ? "bg-primary/10 text-primary" : ""
                }`}
              >
                {Number(date.slice(-2))}
              </span>
              {!isFuture && (
                <>
                  <span className={`mt-auto text-[10px] font-semibold leading-3 sm:text-xs ${isSelected ? "text-white" : "text-slate-700"}`}>
                    {attendanceText}
                  </span>
                  <span className={`mt-0.5 text-[9px] leading-3 sm:text-[10px] ${isSelected ? "text-white/75" : "text-slate-400"}`}>
                    {summary?.recordedCount ? `${summary.recordedCount}명 처리` : "미기록"}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>휴관과 수업 없는 요일은 결석으로 자동 집계하지 않습니다.</span>
        <span>날짜를 선택하면 상단에 해당 일자의 출결 현황이 표시됩니다.</span>
      </div>
    </section>
  );
}
