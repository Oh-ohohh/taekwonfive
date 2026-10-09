"use client";

import type { AttendanceEntry, ClassSession } from "@/types/attendance";
import { CLASS_SESSIONS } from "@/lib/class-session";
import { formatBeltLabel } from "@/types/student";
import type { ScheduleState } from "@/lib/student-schedule";
import { Check, Loader2 } from "lucide-react";

/** Unchecked cards show only the name. Only an explicit absent record
 * is labelled 결석; toggling an attendance off clears the record.
 * Cards whose student is not scheduled for the date are tinted
 * (다른 요일 amber, 휴관 slate, 공휴일·주말 rose) but stay checkable — they may show up. */
export function AttendanceRow({
  entry,
  onToggle,
  onClassSessionChange,
  attendanceNote,
  scheduleState = "scheduled",
}: {
  entry: AttendanceEntry;
  onToggle: (entry: AttendanceEntry) => void;
  onClassSessionChange: (entry: AttendanceEntry, classSession: ClassSession | null) => void;
  attendanceNote?: string;
  scheduleState?: ScheduleState;
}) {
  const { student, status, pending } = entry;
  const attending = status === "present" || status === "late";
  const offDay = scheduleState === "off_day";
  const onLeave = scheduleState === "on_leave";
  const dayOff = scheduleState === "day_off";
  const beltLabel = formatBeltLabel(student.grade, student.poom);
  const statusLabel = attending ? "출석 완료" : status === "absent" ? "결석" : onLeave ? "휴관" : "";

  return (
    <div
      className={`relative isolate flex min-h-24 flex-col items-start justify-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${pending ? "opacity-60" : ""} ${
        attending
          ? "border-sky-300 bg-sky-100 text-sky-900"
          : onLeave ? "border-slate-300 bg-slate-100 text-slate-500 hover:border-slate-400 hover:bg-slate-200"
          : offDay ? "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400 hover:bg-amber-100"
          : dayOff ? "border-rose-200 bg-rose-50 text-rose-900 hover:border-rose-300 hover:bg-rose-100"
          : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(entry)}
        disabled={pending}
        aria-pressed={attending}
        aria-label={`${student.name}${beltLabel !== "-" ? `, ${beltLabel}` : ""}${statusLabel ? `, ${statusLabel}` : ""}${attendanceNote ? `, ${attendanceNote}` : ""}${pending ? ", 처리 중" : ""}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-default"
      />
      <div className="pointer-events-none flex w-full min-w-0 items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-base font-bold">{student.name}</span>
        {attending && (
          <select
            aria-label={`${student.name} 수업 부 선택`}
            value={entry.classSession ?? ""}
            disabled={pending}
            onChange={(event) => onClassSessionChange(entry, event.target.value === "" ? null : Number(event.target.value) as ClassSession)}
            className="pointer-events-auto relative z-10 h-9 max-w-20 shrink-0 rounded-lg border border-sky-300 bg-white px-1 text-xs font-semibold text-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-default"
          >
            <option value="">부 선택</option>
            {CLASS_SESSIONS.map((session) => (
              <option key={session.value} value={session.value}>{session.value}부</option>
            ))}
          </select>
        )}
      </div>
      {beltLabel !== "-" && (
        <span className={`pointer-events-none -mt-1.5 w-full truncate text-xs font-medium ${attending ? "text-sky-700" : offDay ? "text-amber-700" : dayOff ? "text-rose-700" : "text-slate-500"}`}>
          {beltLabel}
        </span>
      )}
      {(pending || statusLabel) && (
        <span className={`pointer-events-none flex items-center gap-1.5 text-[11px] font-medium ${attending ? "text-sky-700" : offDay ? "text-amber-700" : "text-slate-500"}`}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : attending ? <Check className="h-3 w-3" /> : null}
          {pending ? "처리 중" : statusLabel}
        </span>
      )}
      {attendanceNote && <span className={`pointer-events-none text-[10px] leading-relaxed ${!attending && offDay ? "text-amber-700" : "text-slate-500"}`}>{attendanceNote}</span>}
    </div>
  );
}
