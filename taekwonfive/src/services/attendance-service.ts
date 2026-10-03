import { createClient } from "@/utils/supabase/client";
import type { AttendanceRecord, ClassSession, StoredAttendanceStatus, TodayAttendanceSummary } from "@/types/attendance";
import { getKoreaDateString } from "@/lib/date";
import { getAutomaticClassSession } from "@/lib/class-session";
import { getStudents } from "@/services/student-service";
import { buildAttendanceEntries, getAttendanceRosterSummary } from "@/lib/attendance-roster";

/**
 * Attendance data access layer, backed by the Supabase `attendance_records`
 * table. UI components must never query Supabase directly for attendance
 * data — only this file may.
 */

type AttendanceRow = {
  id: string;
  student_id: number | string;
  attendance_date: string;
  status: string;
  checked_at: string | null;
  class_session: ClassSession | null;
  note: string | null;
};

function mapRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    studentId: String(row.student_id),
    date: row.attendance_date,
    status: row.status as StoredAttendanceStatus,
    checkedAt: row.checked_at,
    classSession: row.class_session ?? null,
    note: row.note,
  };
}

/** All attendance records for one Korea-calendar date ("YYYY-MM-DD").
 * Students with no row for this date are simply absent from the result —
 * the caller treats them as "not_checked". */
export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("attendance_date", date);
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** All attendance records in an inclusive Korea-calendar date range. */
export async function getAttendanceByDateRange(
  startDate: string,
  endDate: string
): Promise<AttendanceRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

/** Creates or updates a student's attendance record for the given date.
 * Upserts on the (student_id, attendance_date) unique constraint, so a
 * repeated call for the same student/day always updates the same row
 * instead of inserting a duplicate. */
export async function upsertAttendance(
  studentId: string,
  date: string,
  status: StoredAttendanceStatus
): Promise<AttendanceRecord> {
  const supabase = createClient();
  const now = new Date();
  const attending = status === "present" || status === "late";
  const checkedAt = attending ? now.toISOString() : null;
  const classSession = attending ? getAutomaticClassSession(date, now) : null;

  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(
      { student_id: studentId, attendance_date: date, status, checked_at: checkedAt, class_session: classSession },
      { onConflict: "student_id,attendance_date" }
    )
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Edit only the session of an existing attended record; keep its timestamp. */
export async function updateAttendanceClassSession(
  studentId: string,
  date: string,
  classSession: ClassSession | null
): Promise<AttendanceRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("attendance_records")
    .update({ class_session: classSession })
    .eq("student_id", studentId)
    .eq("attendance_date", date)
    .in("status", ["present", "late"])
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

/** Resets a student back to "not_checked" for the given date by deleting
 * their attendance row, if one exists. */
export async function resetAttendance(studentId: string, date: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("student_id", studentId)
    .eq("attendance_date", date);
  if (error) throw error;
}

/** Aggregate stats + recent activity for today (Asia/Seoul), for the
 * dashboard. Always reflects "today" regardless of what date the
 * attendance-check screen currently has selected. */
export async function getTodayAttendanceSummary(): Promise<TodayAttendanceSummary> {
  const supabase = createClient();
  const today = getKoreaDateString();

  const [students, recordsResult] = await Promise.all([
    getStudents(),
    supabase.from("attendance_records").select("*").eq("attendance_date", today),
  ]);

  if (recordsResult.error) throw recordsResult.error;

  const totalStudents = students.length;
  const records = (recordsResult.data ?? []).map(mapRow);
  const roster = getAttendanceRosterSummary(buildAttendanceEntries(students, records), today, today);

  const presentCount = records.filter((r) => r.status === "present").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = roster.absentCount;
  const notCheckedCount = roster.notCheckedCount ?? 0;
  const attendanceRate = roster.attendanceRate ?? 0;

  const recentRecords = records
    .filter((r) => r.checkedAt !== null)
    .sort((a, b) => (b.checkedAt as string).localeCompare(a.checkedAt as string))
    .slice(0, 6);

  return {
    totalStudents,
    presentCount,
    lateCount,
    absentCount,
    notCheckedCount,
    attendanceRate,
    recentRecords,
  };
}
