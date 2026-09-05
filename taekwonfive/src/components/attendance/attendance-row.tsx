"use client";

import type { AttendanceEntry, AttendanceStatus } from "@/types/attendance";
import { StatusBadge } from "@/components/ui/status-badge";
import { AttendanceStatusButtons } from "@/components/attendance/attendance-status-buttons";
import { formatTime } from "@/lib/date";

export function AttendanceRow({
  entry,
  onChangeStatus,
}: {
  entry: AttendanceEntry;
  onChangeStatus: (studentId: string, status: AttendanceStatus) => void;
}) {
  const { student, status, checkedAt } = entry;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3 sm:min-w-[220px] sm:justify-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900">{student.name}</p>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {student.classGroup}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {student.school} {student.grade} · {student.belt}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
          <StatusBadge status={status} />
          <span className="text-[11px] text-slate-400">{formatTime(checkedAt)}</span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <StatusBadge status={status} />
        <span className="text-[11px] text-slate-400">{formatTime(checkedAt)}</span>
      </div>

      <AttendanceStatusButtons current={status} onChange={(next) => onChangeStatus(student.id, next)} />
    </li>
  );
}
