"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useStudents } from "@/context/students-context";
import { ErrorState, LoadingState } from "@/components/ui/data-states";
import { formatDateDots, getCalendarWeekday, getDateRangeDates, getKoreaDateString } from "@/lib/date";
import { isAttending } from "@/lib/attendance-roster";
import { isStudentOnLeave, isStudentScheduled } from "@/lib/student-schedule";
import { getAttendanceByDateRange } from "@/services/attendance-service";
import type { AttendanceRecord } from "@/types/attendance";

const WEEKDAY_LABELS = ["", "월", "화", "수", "목", "금", "토", "일"];

/** 기간 출석부: 윗줄은 날짜, 왼쪽은 이름, 칸에는 출석(○)/결석(×)을 표시한다. */
export function AttendanceRangePdfView({ startDate, endDate, autoPrint }: { startDate: string; endDate: string; autoPrint: boolean }) {
  const { students, loading: studentsLoading, error: studentsError } = useStudents();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAttendanceByDateRange(startDate, endDate);
        if (active) setRecords(data);
      } catch {
        if (active) setError("기간 출석 현황을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRecords();
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const dates = useMemo(() => getDateRangeDates(startDate, endDate), [startDate, endDate]);

  const recordByKey = useMemo(
    () => new Map(records.map((record) => [`${record.studentId}|${record.date}`, record])),
    [records]
  );

  // 휴관 학생은 기간 중 기록이 있을 때만 명단에 넣는다.
  const rows = useMemo(() => {
    const recordedStudentIds = new Set(records.map((record) => record.studentId));
    return students
      .filter((student) => !isStudentOnLeave(student) || recordedStudentIds.has(student.id))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"))
      .map((student) => ({
        student,
        presentCount: dates.filter((date) => {
          const record = recordByKey.get(`${student.id}|${date}`);
          return record ? isAttending(record.status) : false;
        }).length,
      }));
  }, [students, records, dates, recordByKey]);

  const dailyPresentCounts = useMemo(
    // 표에 있는 학생만 센다(삭제된 학생의 기록은 행이 없으므로 제외).
    () => dates.map((date) => rows.filter(({ student }) => {
      const record = recordByKey.get(`${student.id}|${date}`);
      return record ? isAttending(record.status) : false;
    }).length),
    [dates, rows, recordByKey]
  );

  useEffect(() => {
    if (!autoPrint || hasPrinted.current || loading || studentsLoading || error || studentsError) return;
    hasPrinted.current = true;
    window.setTimeout(() => window.print(), 100);
  }, [autoPrint, error, loading, studentsError, studentsLoading]);

  if (loading || studentsLoading) return <LoadingState label="PDF 출석부를 준비하는 중입니다..." />;
  if (error || studentsError) return <ErrorState message={error ?? studentsError ?? undefined} />;

  // 날짜가 많을수록 글자를 줄여 가로 한 장 폭에 맞춘다.
  const text = dates.length <= 10 ? "text-xs" : dates.length <= 20 ? "text-[11px]" : "text-[9px]";
  const cell = "border border-slate-300 px-0.5 py-1 text-center whitespace-nowrap";

  return (
    <div className="mx-auto w-full max-w-6xl print:max-w-none">
      {/* 날짜 칸이 넓게 필요하므로 이 화면만 가로 A4로 인쇄한다(globals.css의 세로 설정을 덮어씀). */}
      <style>{"@media print { @page { size: A4 landscape; margin: 0; } }"}</style>

      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.close()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          닫기
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          PDF로 저장
        </button>
      </div>

      <article className="border border-slate-200 bg-white p-6 print:border-0 print:p-[10mm] sm:p-8">
        <header className="flex items-end justify-between gap-5 border-b-2 border-primary pb-4">
          <div>
            <p className="text-sm font-semibold text-primary">태권파이브 출결 관리</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">기간 출석 현황</h1>
            <p className="mt-2 text-sm text-slate-600">
              {formatDateDots(startDate)} ~ {formatDateDots(endDate)} ({dates.length}일)
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-slate-500">
            <p>○ 출석 · × 결석 · 회색 칸 출석요일 아님</p>
            <p className="mt-1 text-slate-400">출력일 {formatDateDots(getKoreaDateString())}</p>
          </div>
        </header>

        {rows.length === 0 ? (
          <div className="mt-5 flex min-h-48 items-center justify-center border border-dashed border-slate-200 text-center text-sm text-slate-500">
            출력할 학생이 없습니다.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto print:overflow-visible">
            <table className={`w-full table-fixed border-collapse ${text}`}>
              <colgroup>
                <col className="w-[5.5rem]" />
                {dates.map((date) => <col key={date} />)}
                <col className="w-10" />
              </colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className={`${cell} text-left`}>이름</th>
                  {dates.map((date) => {
                    const weekday = getCalendarWeekday(date);
                    return (
                      <th key={date} className={`${cell} font-semibold ${weekday === 7 ? "text-red-600" : weekday === 6 ? "text-blue-600" : ""}`}>
                        <span className="block">{Number(date.slice(8))}</span>
                        <span className="block font-normal">{WEEKDAY_LABELS[weekday]}</span>
                      </th>
                    );
                  })}
                  <th className={`${cell} font-semibold`}>합계</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, presentCount }) => (
                  <tr key={student.id} className="break-inside-avoid">
                    <th scope="row" className={`${cell} truncate text-left font-semibold text-slate-800`}>{student.name}</th>
                    {dates.map((date) => {
                      const record = recordByKey.get(`${student.id}|${date}`);
                      const offDay = !isStudentScheduled(student, date);
                      return (
                        <td key={date} className={`${cell} ${offDay ? "bg-slate-100" : ""}`}>
                          {record && isAttending(record.status) ? (
                            <span className="font-bold text-sky-700">○</span>
                          ) : record?.status === "absent" ? (
                            <span className="font-bold text-red-500">×</span>
                          ) : null}
                        </td>
                      );
                    })}
                    <td className={`${cell} font-bold text-slate-800`}>{presentCount}</td>
                  </tr>
                ))}
              </tbody>
              <tbody>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <th scope="row" className={`${cell} text-left`}>출석 인원</th>
                  {dailyPresentCounts.map((count, index) => (
                    <td key={dates[index]} className={cell}>{count || ""}</td>
                  ))}
                  <td className={cell}>{dailyPresentCounts.reduce((sum, count) => sum + count, 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
