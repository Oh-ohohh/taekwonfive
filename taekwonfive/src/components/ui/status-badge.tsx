import type { AttendanceStatus } from "@/types/attendance";
import { ATTENDANCE_STATUS_LABEL } from "@/types/attendance";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  not_checked: "bg-slate-100 text-slate-500",
  present: "bg-emerald-100 text-emerald-700",
  late: "bg-orange-100 text-orange-700",
  absent: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {ATTENDANCE_STATUS_LABEL[status]}
    </span>
  );
}
