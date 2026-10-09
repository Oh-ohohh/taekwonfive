import { createClient } from "@/utils/supabase/client";
import type { AttendanceRecord, ClassSession, StoredAttendanceStatus, TodayAttendanceSummary } from "@/types/attendance";
import type { Student } from "@/types/student";
import { getKoreaDateString } from "@/lib/date";
import { getAutomaticClassSession } from "@/lib/class-session";
import { getStudents } from "@/services/student-service";
import { buildAttendanceEntries, getAttendanceRosterSummary, getAutoAbsentRange, getAutoAbsentTargets } from "@/lib/attendance-roster";

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

/** "기타"는 DB의 status 제약(present/late/absent)을 바꾸지 않도록
 * status "absent" + note 앞의 표식으로 저장하고, 읽을 때 "other"로 되돌린다.
 * 이 변환은 이 파일 안에서만 일어나며, 나머지 코드는 "other"만 본다. */
const OTHER_NOTE_MARKER = "[기타]";

function toStoredStatus(status: StoredAttendanceStatus, note: string | null): { status: string; note: string | null } {
  const memo = note?.trim() || null;
  if (status !== "other") return { status, note: memo };
  return { status: "absent", note: memo ? `${OTHER_NOTE_MARKER} ${memo}` : OTHER_NOTE_MARKER };
}

function mapRow(row: AttendanceRow): AttendanceRecord {
  const other = row.status === "absent" && (row.note?.startsWith(OTHER_NOTE_MARKER) ?? false);
  return {
    id: row.id,
    studentId: String(row.student_id),
    date: row.attendance_date,
    status: other ? "other" : row.status as StoredAttendanceStatus,
    checkedAt: row.checked_at,
    classSession: row.class_session ?? null,
    note: other ? row.note!.slice(OTHER_NOTE_MARKER.length).trim() || null : row.note,
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
 * instead of inserting a duplicate. The memo is kept only for 결석·기타;
 * attending records clear it. A given class session overrides the automatic one. */
export async function upsertAttendance(
  studentId: string,
  date: string,
  status: StoredAttendanceStatus,
  options: { classSession?: ClassSession; note?: string | null } = {}
): Promise<AttendanceRecord> {
  const supabase = createClient();
  const now = new Date();
  const attending = status === "present" || status === "late";
  const checkedAt = attending ? now.toISOString() : null;
  const classSession = attending ? options.classSession ?? getAutomaticClassSession(date, now) : null;
  const stored = toStoredStatus(status, attending ? null : options.note ?? null);

  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(
      { student_id: studentId, attendance_date: date, status: stored.status, note: stored.note, checked_at: checkedAt, class_session: classSession },
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

/** 지난 날짜(자동 결석 시작일~어제)에 수업 대상이었지만 체크하지 않은 학생을 결석으로 저장한다.
 * 이미 기록이 있는 학생은 건드리지 않는다. 저장한 건수를 돌려준다. */
export async function markMissedAttendanceAbsent(students: Student[], today = getKoreaDateString()): Promise<number> {
  const range = getAutoAbsentRange(today);
  if (!range) return 0;
  const records = await getAttendanceByDateRange(range.startDate, range.endDate);
  const targets = getAutoAbsentTargets(students, records, range.startDate, range.endDate);
  if (targets.length === 0) return 0;

  const supabase = createClient();
  const { error } = await supabase
    .from("attendance_records")
    .upsert(
      targets.map(({ studentId, date }) => ({
        student_id: studentId, attendance_date: date, status: "absent", note: null, checked_at: null, class_session: null,
      })),
      { onConflict: "student_id,attendance_date", ignoreDuplicates: true }
    );
  if (error) throw error;
  return targets.length;
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
