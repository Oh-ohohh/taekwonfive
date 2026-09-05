import { mockStudents } from "@/data/mock-students";
import type { Student, StudentInput } from "@/types/student";
import { generateId } from "@/lib/id";

/**
 * Student data access layer.
 *
 * All functions are `async` and return copies of the data so callers never
 * mutate internal state directly. Today this reads/writes an in-memory copy
 * of the mock data; when Supabase is connected, replace the body of each
 * function with the matching Supabase query and keep the signatures the
 * same. UI components must never import `mock-students.ts` directly — only
 * this file may.
 */

// In-memory store simulating the "students" table. Resets on page reload.
let students: Student[] = [...mockStudents];

// Small artificial delay so loading states are meaningfully exercised in
// the UI, similar to what a real network request would look like.
const NETWORK_DELAY_MS = 300;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

export async function getStudents(): Promise<Student[]> {
  return delay([...students]);
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  return delay(students.find((student) => student.id === id));
}

export async function createStudent(input: StudentInput): Promise<Student> {
  const newStudent: Student = { ...input, id: generateId("st") };
  students = [newStudent, ...students];
  return delay(newStudent);
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentInput>
): Promise<Student | undefined> {
  let updated: Student | undefined;
  students = students.map((student) => {
    if (student.id !== id) return student;
    updated = { ...student, ...updates };
    return updated;
  });
  return delay(updated);
}

export async function deleteStudent(id: string): Promise<boolean> {
  const beforeCount = students.length;
  students = students.filter((student) => student.id !== id);
  return delay(students.length < beforeCount);
}
