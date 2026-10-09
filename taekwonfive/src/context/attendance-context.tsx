"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AttendanceEntry,
  AttendanceRecord,
  ClassSession,
  StoredAttendanceStatus,
  TodayAttendanceSummary,
} from "@/types/attendance";
import {
  getAttendanceByDate,
  getAttendanceByDateRange,
  getTodayAttendanceSummary,
  markMissedAttendanceAbsent,
  resetAttendance,
  upsertAttendance,
  updateAttendanceClassSession,
} from "@/services/attendance-service";
import { getKoreaDateString, getMonthDateRange, isCalendarDateString } from "@/lib/date";
import { useStudents } from "@/context/students-context";

type AttendanceContextValue = {
  entries: AttendanceEntry[];
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  refresh: () => Promise<void>;
  setStatus: (
    studentId: string,
    status: StoredAttendanceStatus,
    options?: { classSession?: ClassSession; note?: string | null }
  ) => Promise<AttendanceEntry>;
  resetStatus: (studentId: string) => Promise<void>;
  setClassSession: (studentId: string, classSession: ClassSession | null) => Promise<void>;
  /** 자동 결석 처리로 저장된 기록이 생길 때마다 바뀐다. 다른 조회 훅이 다시 불러오는 신호. */
  recordsVersion: number;
};

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const [selectedDate, setSelectedDateState] = useState<string>(() => getKoreaDateString());
  const currentDate = useRef(selectedDate);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordsVersion, setRecordsVersion] = useState(0);
  const autoAbsentDate = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceByDate(selectedDate);
      if (currentDate.current === selectedDate) setRecords(data);
    } catch {
      if (currentDate.current === selectedDate) setError("출석 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      if (currentDate.current === selectedDate) setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    // Deferred via a microtask: `refresh` sets loading state before its
    // first `await`, and effects should not synchronously trigger setState.
    queueMicrotask(() => {
      refresh();
    });
  }, [refresh]);

  // 다음 날이 되면 전날까지 체크하지 않은 수업 대상 학생을 결석으로 저장한다.
  // 앱을 열 때와 화면으로 돌아올 때 하루에 한 번 확인한다.
  useEffect(() => {
    if (studentsLoading || studentsError || students.length === 0) return;
    async function run() {
      const today = getKoreaDateString();
      if (autoAbsentDate.current === today) return;
      autoAbsentDate.current = today;
      try {
        const saved = await markMissedAttendanceAbsent(students, today);
        if (saved > 0) {
          setRecordsVersion((version) => version + 1);
          if (currentDate.current < today) void refresh();
        }
      } catch {
        autoAbsentDate.current = null;
      }
    }
    void run();
    const handleVisible = () => { if (document.visibilityState === "visible") void run(); };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, [students, studentsLoading, studentsError, refresh]);

  // 미래 날짜도 미리 출석 체크할 수 있다. 비었거나 잘못된 값만 무시한다.
  const setSelectedDate = useCallback((date: string) => {
    if (!isCalendarDateString(date) || date === currentDate.current) return;
    currentDate.current = date;
    setLoading(true);
    setRecords([]);
    setSelectedDateState(date);
  }, []);

  // Combine the roster with the selected date's records into one
  // view-model list. Recomputes whenever students or records change.
  const entries = useMemo<AttendanceEntry[]>(() => {
    return students.map((student) => {
      const record = records.find((r) => r.studentId === student.id);
      return {
        student,
        status: record?.status ?? "not_checked",
        checkedAt: record?.checkedAt ?? null,
        classSession: record?.classSession ?? null,
        note: record?.note ?? null,
        pending: pendingIds.has(student.id),
      };
    });
  }, [students, records, pendingIds]);

  const setStatus = useCallback(
    async (studentId: string, status: StoredAttendanceStatus, options?: { classSession?: ClassSession; note?: string | null }) => {
      const student = students.find((item) => item.id === studentId);
      // 출석요일이 아닌 날(다른 요일·휴관)에도 보강·방문 출석은 체크할 수 있다.
      if (!student) {
        throw new Error("학생 정보를 찾을 수 없습니다. 목록을 새로 불러와주세요.");
      }
      setPendingIds((prev) => new Set(prev).add(studentId));
      try {
        const record = await upsertAttendance(studentId, selectedDate, status, options);
        setRecords((prev) => {
          if (currentDate.current !== selectedDate) return prev;
          const existingIndex = prev.findIndex((r) => r.studentId === studentId);
          if (existingIndex >= 0) {
            return prev.map((r, index) => (index === existingIndex ? record : r));
          }
          return [...prev, record];
        });
        return { student, status: record.status, checkedAt: record.checkedAt, classSession: record.classSession, note: record.note };
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      }
    },
    [students, selectedDate]
  );

  const resetStatus = useCallback(
    async (studentId: string) => {
      setPendingIds((prev) => new Set(prev).add(studentId));
      try {
        await resetAttendance(studentId, selectedDate);
        if (currentDate.current === selectedDate) {
          setRecords((prev) => prev.filter((r) => r.studentId !== studentId));
        }
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      }
    },
    [selectedDate]
  );

  const setClassSession = useCallback(
    async (studentId: string, classSession: ClassSession | null) => {
      setPendingIds((prev) => new Set(prev).add(studentId));
      try {
        const record = await updateAttendanceClassSession(studentId, selectedDate, classSession);
        if (currentDate.current === selectedDate) {
          setRecords((prev) => prev.map((item) => item.studentId === studentId ? record : item));
        }
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      }
    },
    [selectedDate]
  );

  const value = useMemo(
    () => ({
      entries,
      loading: loading || studentsLoading,
      error: error ?? studentsError,
      selectedDate,
      setSelectedDate,
      refresh,
      setStatus,
      resetStatus,
      setClassSession,
      recordsVersion,
    }),
    [
      entries,
      loading,
      studentsLoading,
      error,
      studentsError,
      selectedDate,
      setSelectedDate,
      refresh,
      setStatus,
      resetStatus,
      setClassSession,
      recordsVersion,
    ]
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

/** Attendance-check screen state for the currently selected date, backed by
 * `attendance-service.ts`. */
export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}

/**
 * Today's (Asia/Seoul) attendance stats + recent activity, for the
 * dashboard. Independent of `useAttendance`'s selected date, so browsing a
 * past date on the attendance-check screen never changes what the
 * dashboard shows.
 */
export function useTodayAttendanceSummary() {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const recordsVersion = useContext(AttendanceContext)?.recordsVersion ?? 0;
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTodayAttendanceSummary();
      setSummary(data);
    } catch {
      setError("대시보드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
    // recordsVersion: 자동 결석 저장 후 다시 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsVersion]);

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
  }, [refresh]);

  const recentlyAttended = useMemo<AttendanceEntry[]>(() => {
    if (!summary) return [];
    return summary.recentRecords.flatMap((record) => {
      const student = students.find((s) => s.id === record.studentId);
      if (!student) return [];
      return [{ student, status: record.status, checkedAt: record.checkedAt, classSession: record.classSession }];
    });
  }, [summary, students]);

  const stats = useMemo(
    () => ({
      registeredCount: summary?.totalStudents ?? 0,
      presentCount: summary?.presentCount ?? 0,
      lateCount: summary?.lateCount ?? 0,
      absentCount: summary?.absentCount ?? 0,
      notCheckedCount: summary?.notCheckedCount ?? 0,
      attendanceRate: summary?.attendanceRate ?? 0,
    }),
    [summary]
  );

  return {
    stats,
    recentlyAttended,
    loading: loading || studentsLoading,
    error: error ?? studentsError,
    refresh,
  };
}

/**
 * Records for one calendar month, paired with the live roster. The dashboard
 * uses this one query to render the daily totals and the selected day's
 * student-by-student attendance without issuing a request for every date.
 */
export function useMonthlyAttendanceSummary(month: string) {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const recordsVersion = useContext(AttendanceContext)?.recordsVersion ?? 0;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startDate, endDate } = useMemo(() => getMonthDateRange(month), [month]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceByDateRange(startDate, endDate);
      setRecords(data);
    } catch {
      setError("월별 출결 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
    // recordsVersion: 자동 결석 저장 후 다시 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, recordsVersion]);

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
  }, [refresh]);

  return {
    students,
    records,
    loading: loading || studentsLoading,
    error: error ?? studentsError,
    refresh,
  };
}
