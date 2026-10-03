import { createClient } from "@/utils/supabase/client";
import type { Student, StudentInput } from "@/types/student";
import { sortStudentsByRank } from "@/lib/student-sort";

/**
 * Student data access layer, backed by the Supabase `students` table.
 * UI components must never query Supabase directly for student data — only
 * this file may.
 */

type StudentRow = {
  id: number | string;
  name: string;
  birth_date: string | null;
  school: string | null;
  gender: string | null;
  grade: string | null;
  poom: string | null;
  guardian_name: string | null;
  notes: string | null;
  attendance_days: Student["attendanceDays"];
  created_at: string;
};

function mapRow(row: StudentRow): Student {
  return {
    id: String(row.id),
    name: row.name,
    birthDate: row.birth_date,
    school: row.school,
    gender: (row.gender as Student["gender"]) ?? null,
    grade: row.grade,
    poom: row.poom,
    guardianName: row.guardian_name,
    notes: row.notes,
    attendanceDays: row.attendance_days ?? null,
    createdAt: row.created_at,
  };
}

function toRow(input: Partial<StudentInput>) {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.birthDate !== undefined) row.birth_date = input.birthDate || null;
  if (input.school !== undefined) row.school = input.school || null;
  if (input.gender !== undefined) row.gender = input.gender || null;
  if (input.grade !== undefined) row.grade = input.grade || null;
  if (input.poom !== undefined) row.poom = input.poom || null;
  if (input.guardianName !== undefined) row.guardian_name = input.guardianName || null;
  if (input.notes !== undefined) row.notes = input.notes || null;
  if (input.attendanceDays !== undefined) {
    row.attendance_days = input.attendanceDays?.length
      ? [...new Set(input.attendanceDays)].sort((a, b) => a - b)
      : null;
  }
  return row;
}

/** Thrown when deleting a student is blocked because attendance history
 * still references them (foreign key `ON DELETE RESTRICT`). */
export class StudentHasAttendanceError extends Error {}

export async function getStudents(): Promise<Student[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return sortStudentsByRank((data ?? []).map(mapRow));
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : undefined;
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const supabase = createClient();
  const { data, error } = await supabase.from("students").insert(toRow(input)).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentInput>
): Promise<Student | undefined> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update(toRow(updates))
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : undefined;
}

/**
 * Deletes a student. The `students` table has no "재원/활성" style column,
 * so there is no soft-delete flag to fall back on — a student with
 * attendance history is protected purely by the foreign key's
 * `ON DELETE RESTRICT`, and this rejects with `StudentHasAttendanceError`
 * (Postgres error 23503) instead of silently failing.
 */
export async function deleteStudent(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new StudentHasAttendanceError(
        "출석 기록이 있는 학생은 삭제할 수 없습니다. 출석 이력을 보호하기 위해 삭제가 제한됩니다."
      );
    }
    throw error;
  }
  return true;
}
