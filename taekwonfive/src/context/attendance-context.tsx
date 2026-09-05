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
import type { AttendanceEntry, AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { getTodayAttendance, updateAttendanceStatus } from "@/services/attendance-service";
import { useStudents } from "@/context/students-context";

type AttendanceStats = {
  registeredCount: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
};

type AttendanceContextValue = {
  entries: AttendanceEntry[];
  recentlyAttended: AttendanceEntry[];
  stats: AttendanceStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setStatus: (studentId: string, status: AttendanceStatus) => Promise<AttendanceEntry>;
};

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodayAttendance();
      setRecords(data);
    } catch {
      setError("출석 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
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

  // Combine the active roster with today's records into one view-model list.
  // Recomputes automatically whenever students or records change, so
  // registering/editing/deleting a student is reflected immediately.
  const entries = useMemo<AttendanceEntry[]>(() => {
    return students
      .filter((student) => student.active)
      .map((student) => {
        const record = records.find((r) => r.studentId === student.id);
        return {
          student,
          status: record?.status ?? "not_checked",
          checkedAt: record?.checkedAt ?? null,
        };
      });
  }, [students, records]);

  const recentlyAttended = useMemo(() => {
    return entries
      .filter((entry) => entry.checkedAt !== null)
      .sort((a, b) => (b.checkedAt as string).localeCompare(a.checkedAt as string))
      .slice(0, 6);
  }, [entries]);

  const stats = useMemo<AttendanceStats>(() => {
    const registeredCount = entries.length;
    const presentCount = entries.filter(
      (entry) => entry.status === "present" || entry.status === "late"
    ).length;
    const absentCount = registeredCount - presentCount;
    const attendanceRate =
      registeredCount === 0 ? 0 : Math.round((presentCount / registeredCount) * 100);
    return { registeredCount, presentCount, absentCount, attendanceRate };
  }, [entries]);

  const setStatus = useCallback(
    async (studentId: string, status: AttendanceStatus) => {
      const record = await updateAttendanceStatus(studentId, status);
      setRecords((prev) => {
        const existingIndex = prev.findIndex((r) => r.studentId === studentId);
        if (existingIndex >= 0) {
          return prev.map((r, index) => (index === existingIndex ? record : r));
        }
        return [...prev, record];
      });
      const student = students.find((s) => s.id === studentId);
      return {
        student: student as AttendanceEntry["student"],
        status: record.status,
        checkedAt: record.checkedAt,
      };
    },
    [students]
  );

  const value = useMemo(
    () => ({
      entries,
      recentlyAttended,
      stats,
      loading: loading || studentsLoading,
      error: error ?? studentsError,
      refresh,
      setStatus,
    }),
    [entries, recentlyAttended, stats, loading, studentsLoading, error, studentsError, refresh, setStatus]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

/** Today's attendance entries + stats, backed by `attendance-service.ts`. */
export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
