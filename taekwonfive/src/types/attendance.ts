import type { Student } from "@/types/student";

/**
 * Domain types for daily attendance tracking.
 *
 * These types mirror the shape of the future Supabase `attendance_records`
 * table. Keep them in sync with the table schema when the database is
 * connected.
 */

export type AttendanceStatus = "not_checked" | "present" | "late" | "absent";

export type AttendanceRecord = {
  id: string;
  studentId: string;
  /** ISO date string, e.g. "2026-09-03" */
  date: string;
  status: AttendanceStatus;
  /** ISO datetime string set when status becomes "present" or "late" */
  checkedAt: string | null;
};

/**
 * View-model that pairs a student with their attendance status for a given
 * day. Built by combining student and attendance data — UI components read
 * this shape rather than joining the two collections themselves.
 */
export type AttendanceEntry = {
  student: Student;
  status: AttendanceStatus;
  checkedAt: string | null;
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  not_checked: "미출석",
  present: "출석",
  late: "지각",
  absent: "결석",
};
