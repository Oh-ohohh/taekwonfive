/**
 * Domain types for a taekwondo studio's student roster.
 *
 * These mirror the real Supabase `students` table columns (id, name,
 * birth_date, school, gender, grade, poom, guardian_name, notes,
 * created_at). `grade` and `poom` hold rank numbers or labels imported
 * from the roster (e.g. 국기원, 빨간띠), not school grades.
 */

export type Gender = "남" | "여";
export type AttendanceWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Student = {
  id: string;
  name: string;
  birthDate: string | null;
  school: string | null;
  gender: Gender | null;
  /** 급 숫자 또는 원본의 등급 표기 (해당 없으면 null) */
  grade: string | null;
  /** 품 숫자 또는 띠 이름 등의 원본 표기 (해당 없으면 null) */
  poom: string | null;
  guardianName: string | null;
  notes: string | null;
  /** ISO weekdays (Monday=1); null means the student is on leave. */
  attendanceDays: AttendanceWeekday[] | null;
  createdAt: string;
};

/** Fields collected by the student create/edit form. */
export type StudentInput = Omit<Student, "id" | "createdAt">;

/** e.g. (grade="8", poom="2") -> "2품 8급";
 * (grade="3", poom="빨간띠") -> "빨간띠 3급".
 * Keep text labels as written and omit missing values. */
export function formatBeltLabel(grade: string | null, poom: string | null): string {
  function formatPart(value: string | null, suffix: "품" | "급"): string {
    const text = value?.trim();
    if (!text || text === "-") return "";
    return /^\d+$/.test(text) ? `${text}${suffix}` : text;
  }

  return [formatPart(poom, "품"), formatPart(grade, "급")].filter(Boolean).join(" ") || "-";
}
