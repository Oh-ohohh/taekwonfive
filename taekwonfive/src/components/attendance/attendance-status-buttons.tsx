"use client";

import type { AttendanceStatus } from "@/types/attendance";

const OPTIONS: { status: AttendanceStatus; label: string; activeClassName: string }[] = [
  { status: "present", label: "출석", activeClassName: "bg-emerald-600 text-white border-emerald-600" },
  { status: "late", label: "지각", activeClassName: "bg-orange-500 text-white border-orange-500" },
  { status: "absent", label: "결석", activeClassName: "bg-red-600 text-white border-red-600" },
  { status: "not_checked", label: "미출석으로 변경", activeClassName: "bg-slate-500 text-white border-slate-500" },
];

export function AttendanceStatusButtons({
  current,
  onChange,
}: {
  current: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map(({ status, label, activeClassName }) => {
        const active = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            disabled={active}
            className={`h-9 rounded-lg border px-3 text-xs font-semibold transition-colors ${
              active
                ? activeClassName
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
            } disabled:cursor-default`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
