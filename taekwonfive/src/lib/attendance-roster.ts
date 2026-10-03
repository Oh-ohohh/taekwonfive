import { getKoreaDateString } from "@/lib/date";
import { isStudentScheduled } from "@/lib/student-schedule";
import type { AttendanceEntry, AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import type { Student } from "@/types/student";

export type AttendanceScope = "scheduled" | "all";

export function isAttending(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

export function buildAttendanceEntries(students: Student[], records: AttendanceRecord[]): AttendanceEntry[] {
  const byStudent = new Map(records.map((record) => [record.studentId, record]));
  return students.map((student) => {
    const record = byStudent.get(student.id);
    return { student, status: record?.status ?? "not_checked", checkedAt: record?.checkedAt ?? null, classSession: record?.classSession ?? null };
  });
}

/** Today's default roster includes scheduled students and extra attendees.
 * Historical rosters use saved records, never today's schedule as past fact. */
export function getVisibleAttendanceEntries(
  entries: AttendanceEntry[], date: string, scope: AttendanceScope, today = getKoreaDateString()
): AttendanceEntry[] {
  if (scope === "all") return entries;
  if (date < today) return entries.filter((entry) => entry.status !== "not_checked");
  return entries.filter((entry) => isStudentScheduled(entry.student, date) || isAttending(entry.status));
}

export function getAttendanceRosterSummary(entries: AttendanceEntry[], date: string, today = getKoreaDateString()) {
  const historical = date < today;
  const scheduled = entries.filter((entry) => isStudentScheduled(entry.student, date));
  const scheduledPresent = scheduled.filter((entry) => isAttending(entry.status)).length;
  const presentCount = entries.filter((entry) => isAttending(entry.status)).length;
  return {
    historical,
    scheduledCount: historical ? null : scheduled.length,
    scheduledPresent: historical ? null : scheduledPresent,
    additionalPresent: historical ? null : presentCount - scheduledPresent,
    presentCount,
    notCheckedCount: historical ? null : scheduled.filter((entry) => entry.status === "not_checked").length,
    absentCount: (historical ? entries : scheduled).filter((entry) => entry.status === "absent").length,
    attendanceRate: historical || scheduled.length === 0 ? null : Math.round(scheduledPresent / scheduled.length * 100),
  };
}

/** PDF 기간 출석부의 최대 일수. 가로 A4 한 장 폭에 날짜 칸이 들어가는 한도. */
export const MAX_REPORT_DAYS = 31;
