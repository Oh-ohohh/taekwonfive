import { mockAttendance } from "@/data/mock-attendance";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { generateId } from "@/lib/id";
import { getTodayDateString } from "@/lib/date";

/**
 * Attendance data access layer.
 *
 * Mirrors `student-service.ts`: functions are `async`, return copies of the
 * data, and are the only place allowed to import `mock-attendance.ts`. When
 * Supabase is connected, replace the body of each function with the
 * matching Supabase query and keep the signatures the same.
 */

// In-memory store simulating the "attendance_records" table.
let attendanceRecords: AttendanceRecord[] = [...mockAttendance];

const NETWORK_DELAY_MS = 300;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

/** Returns today's attendance records. Students without a record yet are
 * simply absent from this list — the caller treats them as "not_checked". */
export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const today = getTodayDateString();
  return delay(attendanceRecords.filter((record) => record.date === today));
}

/** Creates or updates today's attendance record for a student. */
export async function updateAttendanceStatus(
  studentId: string,
  status: AttendanceStatus
): Promise<AttendanceRecord> {
  const today = getTodayDateString();
  const checkedAt = status === "present" || status === "late" ? new Date().toISOString() : null;

  const existingIndex = attendanceRecords.findIndex(
    (record) => record.studentId === studentId && record.date === today
  );

  let result: AttendanceRecord;
  if (existingIndex >= 0) {
    result = { ...attendanceRecords[existingIndex], status, checkedAt };
    attendanceRecords = attendanceRecords.map((record, index) =>
      index === existingIndex ? result : record
    );
  } else {
    result = { id: generateId("at"), studentId, date: today, status, checkedAt };
    attendanceRecords = [...attendanceRecords, result];
  }

  return delay(result);
}
