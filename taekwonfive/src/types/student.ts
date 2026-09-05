/**
 * Domain types for a taekwondo studio's student roster.
 *
 * These types mirror the shape of the future Supabase `students` table.
 * Keep them in sync with the table schema when the database is connected.
 */

export type Gender = "남" | "여";

export type ClassGroup = "1부" | "2부" | "3부" | "4부" | "성인부";

export type Student = {
  id: string;
  name: string;
  birthDate: string;
  school: string;
  grade: string;
  gender: Gender;
  /** 띠(급) 또는 품·단, 예: "8급", "2품", "1단" */
  belt: string;
  classGroup: ClassGroup;
  guardianName: string;
  guardianPhone: string;
  registrationDate: string;
  notes: string;
  active: boolean;
};

/** Fields collected by the student create/edit form. */
export type StudentInput = Omit<Student, "id">;

export const CLASS_GROUPS: ClassGroup[] = ["1부", "2부", "3부", "4부", "성인부"];
