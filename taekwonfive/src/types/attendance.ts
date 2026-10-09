import type { Student } from "@/types/student";
import type { AttendanceRosterSummary } from "@/lib/attendance-roster";

/**
 * Domain types for daily attendance tracking.
 *
 * These mirror the Supabase `attendance_records` table. A student with no
 * row for a given `attendance_date` is treated as "not_checked" — that
 * status never exists as a stored row (see the table's status check
 * constraint), only as the view-model's default for an absent record.
 */

/** "other"(기타)는 출석도 결석도 아닌 상태로, 어느 집계에도 넣지 않는다. */
export type AttendanceStatus = "not_checked" | "present" | "late" | "absent" | "other";

/** The subset of `AttendanceStatus` that can actually be persisted. */
export type StoredAttendanceStatus = Exclude<AttendanceStatus, "not_checked">;

export type ClassSession = 1 | 2 | 3 | 4 | 5 | 6;

export type AttendanceRecord = {
  id: string;
  studentId: string;
  /** "YYYY-MM-DD", Korea (Asia/Seoul) calendar date */
  date: string;
  status: StoredAttendanceStatus;
  /** ISO datetime string set when status is "present" or "late" */
  checkedAt: string | null;
  classSession: ClassSession | null;
  note: string | null;
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
  classSession: ClassSession | null;
  /** 결석·기타일 때 남기는 선택 메모 */
  note?: string | null;
  /** True while a status change for this student is being saved. */
  pending?: boolean;
};

/** Aggregate stats + recent activity for today (Asia/Seoul), used by the dashboard. */
export type TodayAttendanceSummary = {
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  notCheckedCount: number;
  attendanceRate: number;
  recentRecords: AttendanceRecord[];
  /** 오늘 기준 수업 대상·출석·체크 전·출석률 */
  roster: AttendanceRosterSummary;
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  not_checked: "미출석",
  present: "출석",
  late: "지각",
  absent: "결석",
  other: "기타",
};
