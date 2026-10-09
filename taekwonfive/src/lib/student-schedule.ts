import { getCalendarWeekday } from "@/lib/date";
import { isDayOff } from "@/lib/holidays";
import type { AttendanceWeekday, Student } from "@/types/student";

export const ATTENDANCE_WEEKDAYS: { value: AttendanceWeekday; label: string }[] = [
  { value: 1, label: "월" }, { value: 2, label: "화" }, { value: 3, label: "수" },
  { value: 4, label: "목" }, { value: 5, label: "금" }, { value: 6, label: "토" }, { value: 7, label: "일" },
];

export function isStudentOnLeave(student: Pick<Student, "attendanceDays">): boolean {
  return !student.attendanceDays?.length;
}

/** 공휴일과 토·일요일에는 아무도 수업 대상이 아니다. */
export function isStudentScheduled(student: Pick<Student, "attendanceDays">, date: string): boolean {
  if (isDayOff(date)) return false;
  return student.attendanceDays?.some((day) => day === getCalendarWeekday(date)) ?? false;
}

export function formatAttendanceDays(days: Student["attendanceDays"]): string {
  if (!days?.length) return "휴관";
  return ATTENDANCE_WEEKDAYS.filter((day) => days.includes(day.value)).map((day) => day.label).join("·");
}

/** How the selected date relates to a student's 출석요일.
 * "off_day"/"on_leave"/"day_off" students stay checkable — they only look different.
 * "day_off" means the date itself is a 공휴일 or weekend. */
export type ScheduleState = "scheduled" | "off_day" | "on_leave" | "day_off";

export function getScheduleState(student: Pick<Student, "attendanceDays">, date: string): ScheduleState {
  if (isStudentOnLeave(student)) return "on_leave";
  if (isDayOff(date)) return "day_off";
  return isStudentScheduled(student, date) ? "scheduled" : "off_day";
}
