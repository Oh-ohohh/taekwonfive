import type { AttendanceEntry } from "@/types/attendance";
import { formatBeltLabel } from "@/types/student";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/data-states";
import { formatTime } from "@/lib/date";

export function RecentAttendanceList({ entries }: { entries: AttendanceEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="아직 오늘 출석한 학생이 없습니다" />;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {entries.map(({ student, status, checkedAt }) => (
        <li key={student.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{student.name}</p>
            <p className="truncate text-xs text-slate-400">
              {student.school ?? "-"} · {formatBeltLabel(student.grade, student.poom)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-xs text-slate-400">{formatTime(checkedAt)}</span>
            <StatusBadge status={status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
