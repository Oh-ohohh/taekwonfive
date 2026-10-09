"use client";

import { CalendarDays, Search } from "lucide-react";
import { formatFullDateWithWeekday, getKoreaDateString } from "@/lib/date";

export type AttendanceStatusFilter = "all" | "present" | "not_checked" | "absent";

const STATUS_OPTIONS: { value: AttendanceStatusFilter; label: string }[] = [
  { value: "present", label: "출석" },
  { value: "not_checked", label: "수업 대상 중 체크 전" },
  { value: "absent", label: "결석" },
];

export function AttendanceToolbar({
  search,
  onSearchChange,
  selectedDate,
  onSelectedDateChange,
  statusFilter,
  onStatusFilterChange,
  historical = false,
  dayOffLabel = null,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  statusFilter: AttendanceStatusFilter;
  onStatusFilterChange: (value: AttendanceStatusFilter) => void;
  historical?: boolean;
  dayOffLabel?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-lg font-bold text-slate-800 sm:text-xl">
        <CalendarDays className="h-5 w-5 text-primary" />
        {formatFullDateWithWeekday(selectedDate)}
        {dayOffLabel && (
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">{dayOffLabel}</span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="학생 이름 검색"
            aria-label="수련생 이름 검색"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <input
          type="date"
          aria-label="출석 확인 날짜"
          value={selectedDate}
          max={getKoreaDateString()}
          onChange={(e) => onSelectedDateChange(e.target.value)}
          className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <select
          aria-label="출석 상태 필터"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as AttendanceStatusFilter)}
          className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">전체 출석 상태</option>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {historical && value === "not_checked" ? "기록 없음" : label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
