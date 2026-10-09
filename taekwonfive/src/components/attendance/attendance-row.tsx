"use client";

import type { AttendanceEntry, ClassSession } from "@/types/attendance";
import { CLASS_SESSIONS } from "@/lib/class-session";
import { formatBeltLabel } from "@/types/student";
import type { ScheduleState } from "@/lib/student-schedule";
import { Check, Loader2, NotebookPen } from "lucide-react";

/** 드롭다운에서 고르는 값: 1~6부, 결석, 기타, 또는 부 미선택(null). */
export type AttendanceMark = ClassSession | "absent" | "other" | null;

/** Unchecked cards show only the name. 결석·기타 are set from the dropdown
 * after checking, and can carry an optional memo; toggling an attendance off clears the record.
 * Cards whose student is not scheduled for the date are tinted
 * (다른 요일 amber, 휴관 slate, 공휴일·주말 rose) but stay checkable — they may show up. */
export function AttendanceRow({
  entry,
  onToggle,
  onClassSessionChange,
  onEditNote,
  attendanceNote,
  scheduleState = "scheduled",
}: {
  entry: AttendanceEntry;
  onToggle: (entry: AttendanceEntry) => void;
  onClassSessionChange: (entry: AttendanceEntry, mark: AttendanceMark) => void;
  onEditNote?: (entry: AttendanceEntry) => void;
  attendanceNote?: string;
  scheduleState?: ScheduleState;
}) {
  const { student, status, pending } = entry;
  const attending = status === "present" || status === "late";
  const offDay = scheduleState === "off_day";
  const onLeave = scheduleState === "on_leave";
  const dayOff = scheduleState === "day_off";
  const beltLabel = formatBeltLabel(student.grade, student.poom);
  const absent = status === "absent";
  const other = status === "other";
  const marked = attending || absent || other;
  const statusLabel = attending ? "출석 완료" : absent ? "결석" : other ? "기타" : onLeave ? "휴관" : "";
  const selectValue = attending ? String(entry.classSession ?? "") : status;

  return (
    <div
      className={`relative isolate flex min-h-24 flex-col items-start justify-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${pending ? "opacity-60" : ""} ${
        attending
          ? "border-sky-300 bg-sky-100 text-sky-900"
          : absent ? "border-red-200 bg-red-50 text-red-900 hover:border-red-300 hover:bg-red-100"
          : other ? "border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-300 hover:bg-violet-100"
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
        {marked && (
          <select
            aria-label={`${student.name} 수업 부 선택`}
            value={selectValue}
            disabled={pending}
            onChange={(event) => {
              const { value } = event.target;
              onClassSessionChange(entry, value === "" ? null : value === "absent" || value === "other" ? value : Number(value) as ClassSession);
            }}
            className={`pointer-events-auto relative z-10 h-9 max-w-20 shrink-0 rounded-lg border bg-white px-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-default ${
              absent ? "border-red-300 text-red-700" : other ? "border-violet-300 text-violet-700" : "border-sky-300 text-sky-800"
            }`}
          >
            {attending && <option value="">부 선택</option>}
            {CLASS_SESSIONS.map((session) => (
              <option key={session.value} value={session.value}>{session.value}부</option>
            ))}
            <option value="absent">결석</option>
            <option value="other">기타</option>
          </select>
        )}
      </div>
      {beltLabel !== "-" && (
        <span className={`pointer-events-none -mt-1.5 w-full truncate text-xs font-medium ${attending ? "text-sky-700" : offDay ? "text-amber-700" : dayOff ? "text-rose-700" : "text-slate-500"}`}>
          {beltLabel}
        </span>
      )}
      {(pending || statusLabel) && (
        <span className={`pointer-events-none flex items-center gap-1.5 text-[11px] font-medium ${attending ? "text-sky-700" : absent ? "text-red-700" : other ? "text-violet-700" : offDay ? "text-amber-700" : "text-slate-500"}`}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : attending ? <Check className="h-3 w-3" /> : null}
          {pending ? "처리 중" : statusLabel}
        </span>
      )}
      {(absent || other) && onEditNote && (
        <button
          type="button"
          onClick={() => onEditNote(entry)}
          disabled={pending}
          aria-label={`${student.name} ${absent ? "결석" : "기타"} 메모 ${entry.note ? "수정" : "작성"}`}
          className={`relative z-10 flex w-full min-w-0 items-center gap-1 rounded-md border border-dashed bg-white/70 px-1.5 py-1 text-left text-[11px] disabled:cursor-default ${
            absent ? "border-red-200 text-red-800" : "border-violet-200 text-violet-800"
          }`}
        >
          <NotebookPen className="h-3 w-3 shrink-0" />
          <span className={`truncate ${entry.note ? "" : "opacity-60"}`}>{entry.note || "메모 (선택)"}</span>
        </button>
      )}
      {attendanceNote && <span className={`pointer-events-none text-[10px] leading-relaxed ${!attending && offDay ? "text-amber-700" : "text-slate-500"}`}>{attendanceNote}</span>}
    </div>
  );
}
