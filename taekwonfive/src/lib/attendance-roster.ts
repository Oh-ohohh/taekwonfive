import { getDateRangeDates, getKoreaDateString, shiftDate } from "@/lib/date";
import { isStudentScheduled } from "@/lib/student-schedule";
import type { AttendanceEntry, AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import type { Student } from "@/types/student";

/** "not_attended": 그날 수업 대상 중 아직 출석하지 않은 학생(체크 전·결석·기타). */
export type AttendanceScope = "scheduled" | "not_attended" | "all";

export function isAttending(status: AttendanceStatus): boolean {
  return status === "present" || status === "late";
}

export function buildAttendanceEntries(students: Student[], records: AttendanceRecord[]): AttendanceEntry[] {
  const byStudent = new Map(records.map((record) => [record.studentId, record]));
  return students.map((student) => {
    const record = byStudent.get(student.id);
    return { student, status: record?.status ?? "not_checked", checkedAt: record?.checkedAt ?? null, classSession: record?.classSession ?? null, note: record?.note ?? null };
  });
}

/** Today's default roster includes scheduled students and extra attendees.
 * Historical rosters use saved records, never today's schedule as past fact. */
export function getVisibleAttendanceEntries(
  entries: AttendanceEntry[], date: string, scope: AttendanceScope, today = getKoreaDateString()
): AttendanceEntry[] {
  if (scope === "all") return entries;
  if (scope === "not_attended") {
    return entries.filter((entry) => isStudentScheduled(entry.student, date) && !isAttending(entry.status));
  }
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
    /** 기타는 출석·결석 어디에도 넣지 않고 따로 센다. */
    otherCount: entries.filter((entry) => entry.status === "other").length,
    attendanceRate: historical || scheduled.length === 0 ? null : Math.round(scheduledPresent / scheduled.length * 100),
  };
}

export type AttendanceRosterSummary = ReturnType<typeof getAttendanceRosterSummary>;

/** 자동 결석 처리를 시작한 날. 이전 날짜는 당시 출석요일을 알 수 없어 소급하지 않는다. */
export const AUTO_ABSENT_START_DATE = "2026-10-08";
/** 앱을 오래 열지 않았을 때 한 번에 거슬러 올라가 처리하는 최대 일수. */
const AUTO_ABSENT_LOOKBACK_DAYS = 31;

/** 자동 결석 처리 대상 기간(어제까지). 처리할 날이 없으면 null. */
export function getAutoAbsentRange(today = getKoreaDateString()): { startDate: string; endDate: string } | null {
  const endDate = shiftDate(today, -1);
  const lookback = shiftDate(today, -AUTO_ABSENT_LOOKBACK_DAYS);
  const startDate = lookback > AUTO_ABSENT_START_DATE ? lookback : AUTO_ABSENT_START_DATE;
  return startDate > endDate ? null : { startDate, endDate };
}

/** 지난 날짜에 수업 대상이었는데 아무 기록이 없는 학생 → 결석으로 저장할 목록.
 * 공휴일·주말·다른 요일·휴관 학생과 그날 이후 등록한 학생은 제외한다. */
export function getAutoAbsentTargets(
  students: Student[], records: AttendanceRecord[], startDate: string, endDate: string
): { studentId: string; date: string }[] {
  const recorded = new Set(records.map((record) => `${record.studentId}|${record.date}`));
  return getDateRangeDates(startDate, endDate).flatMap((date) => students
    .filter((student) => isStudentScheduled(student, date)
      && (!student.createdAt || getKoreaDateString(new Date(student.createdAt)) <= date)
      && !recorded.has(`${student.id}|${date}`))
    .map((student) => ({ studentId: student.id, date })));
}

/** PDF 기간 출석부의 최대 일수. 가로 A4 한 장 폭에 날짜 칸이 들어가는 한도. */
export const MAX_REPORT_DAYS = 31;
