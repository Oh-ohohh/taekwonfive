"use client";

import type { ReactNode } from "react";
import { StudentsProvider } from "@/context/students-context";
import { AttendanceProvider } from "@/context/attendance-context";

/**
 * Combines every global data context. `AttendanceProvider` reads the
 * student roster via `useStudents()`, so it must be nested inside
 * `StudentsProvider`.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  return (
    <StudentsProvider>
      <AttendanceProvider>{children}</AttendanceProvider>
    </StudentsProvider>
  );
}
