import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { getTodayDateString } from "@/lib/date";

const today = getTodayDateString();

/** Builds an ISO datetime string for today at the given hour/minute. */
function todayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function record(
  id: string,
  studentId: string,
  status: AttendanceStatus,
  checkedAt: string | null
): AttendanceRecord {
  return { id, studentId, date: today, status, checkedAt };
}

/**
 * Example attendance records for today, used while Supabase is not yet
 * connected. `attendance-service.ts` is the only module allowed to import
 * this file. Students with no record for today are treated as
 * "not_checked" by the service layer.
 */
export const mockAttendance: AttendanceRecord[] = [
  record("at-001", "st-001", "present", todayAt(9, 2)),
  record("at-002", "st-002", "present", todayAt(9, 5)),
  record("at-003", "st-003", "late", todayAt(9, 20)),
  record("at-004", "st-004", "present", todayAt(16, 31)),
  record("at-005", "st-005", "not_checked", null),
  record("at-006", "st-006", "present", todayAt(16, 35)),
  record("at-007", "st-007", "late", todayAt(18, 12)),
  record("at-008", "st-008", "absent", null),
  record("at-009", "st-009", "present", todayAt(18, 2)),
  record("at-010", "st-010", "not_checked", null),
  record("at-011", "st-011", "present", todayAt(9, 10)),
  record("at-012", "st-012", "not_checked", null),
  record("at-013", "st-013", "present", todayAt(16, 40)),
  record("at-014", "st-014", "not_checked", null),
];
