"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Student, StudentInput } from "@/types/student";
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
} from "@/services/student-service";

type StudentsContextValue = {
  students: Student[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addStudent: (input: StudentInput) => Promise<Student>;
  editStudent: (id: string, updates: Partial<StudentInput>) => Promise<Student | undefined>;
  removeStudent: (id: string) => Promise<boolean>;
};

const StudentsContext = createContext<StudentsContextValue | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch {
      setError("학생 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deferred via a microtask: `refresh` sets loading state before its
    // first `await`, and effects should not synchronously trigger setState.
    queueMicrotask(() => {
      refresh();
    });
  }, [refresh]);

  const addStudent = useCallback(async (input: StudentInput) => {
    const created = await createStudent(input);
    setStudents((prev) => [created, ...prev]);
    return created;
  }, []);

  const editStudent = useCallback(async (id: string, updates: Partial<StudentInput>) => {
    const updated = await updateStudent(id, updates);
    if (updated) {
      setStudents((prev) => prev.map((student) => (student.id === id ? updated : student)));
    }
    return updated;
  }, []);

  const removeStudent = useCallback(async (id: string) => {
    const deleted = await deleteStudent(id);
    if (deleted) {
      setStudents((prev) => prev.filter((student) => student.id !== id));
    }
    return deleted;
  }, []);

  const value = useMemo(
    () => ({ students, loading, error, refresh, addStudent, editStudent, removeStudent }),
    [students, loading, error, refresh, addStudent, editStudent, removeStudent]
  );

  return <StudentsContext.Provider value={value}>{children}</StudentsContext.Provider>;
}

/** Shared student roster + CRUD actions, backed by `student-service.ts`. */
export function useStudents() {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return context;
}
