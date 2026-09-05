"use client";

import { CalendarDays, Search } from "lucide-react";
import { CLASS_GROUPS, type ClassGroup } from "@/types/student";
import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from "@/types/attendance";
import { formatFullDateWithWeekday } from "@/lib/date";

const STATUS_OPTIONS: AttendanceStatus[] = ["not_checked", "present", "late", "absent"];

export function AttendanceToolbar({
  search,
  onSearchChange,
  classGroupFilter,
  onClassGroupFilterChange,
  statusFilter,
  onStatusFilterChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  classGroupFilter: "all" | ClassGroup;
  onClassGroupFilterChange: (value: "all" | ClassGroup) => void;
  statusFilter: "all" | AttendanceStatus;
  onStatusFilterChange: (value: "all" | AttendanceStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-sm text-slate-500">
        <CalendarDays className="h-4 w-4" />
        {formatFullDateWithWeekday()}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="학생 이름 검색"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <select
          value={classGroupFilter}
          onChange={(e) => onClassGroupFilterChange(e.target.value as "all" | ClassGroup)}
          className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">전체 수업부</option>
          {CLASS_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as "all" | AttendanceStatus)}
          className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">전체 출석 상태</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ATTENDANCE_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
