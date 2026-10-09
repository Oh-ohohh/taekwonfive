"use client";

import { useMemo, useState } from "react";
import { CalendarDays, FileDown, TrendingUp, UserCheck, Users, UserX } from "lucide-react";
import { useMonthlyAttendanceSummary } from "@/context/attendance-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceCalendar, type CalendarDaySummary } from "@/components/dashboard/attendance-calendar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingState, ErrorState } from "@/components/ui/data-states";
import { formatFullDateWithWeekday, getKoreaDateString, getKoreaMonthString } from "@/lib/date";
import type { AttendanceRecord } from "@/types/attendance";
import { PageHeading } from "@/components/layout/page-heading";
import { DojangBanner } from "@/components/dashboard/dojang-banner";
import { getDayOffLabel } from "@/lib/holidays";
import { buildAttendanceEntries, getAttendanceRosterSummary, isAttending } from "@/lib/attendance-roster";
import { ReportRangeModal } from "@/components/dashboard/report-range-modal";

export function DashboardView() {
  const today = getKoreaDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [displayedMonth, setDisplayedMonth] = useState(getKoreaMonthString());
  const { students, records, loading, error, refresh } = useMonthlyAttendanceSummary(displayedMonth);
  const [reportOpen, setReportOpen] = useState(false);

  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, AttendanceRecord[]>();
    records.forEach((record) => {
      const current = grouped.get(record.date) ?? [];
      current.push(record);
      grouped.set(record.date, current);
    });
    return grouped;
  }, [records]);

  const summaries = useMemo(() => {
    const next = new Map<string, CalendarDaySummary>();
    recordsByDate.forEach((dateRecords, date) => {
      next.set(date, {
        attendingCount: dateRecords.filter((record) => isAttending(record.status)).length,
        recordedCount: dateRecords.length,
      });
    });
    return next;
  }, [recordsByDate]);

  const selectedRecords = useMemo(
    () => recordsByDate.get(selectedDate) ?? [],
    [recordsByDate, selectedDate]
  );
  const selectedStats = getAttendanceRosterSummary(buildAttendanceEntries(students, selectedRecords), selectedDate, today);

  function handleChangeMonth(nextMonth: string) {
    setDisplayedMonth(nextMonth);
    setSelectedDate(nextMonth === today.slice(0, 7) ? today : `${nextMonth}-01`);
  }

  function handlePdfExport(startDate: string, endDate: string) {
    const params = new URLSearchParams({ start: startDate, end: endDate, print: "1" });
    window.open(`/attendance/report?${params}`, "_blank", "noopener,noreferrer");
    setReportOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading eyebrow="OUR DOJANG, AT A GLANCE" title="우리 도장 한눈에" description="수련생의 오늘을 살피고, 매일의 성장을 함께하세요." />
      <DojangBanner />
      {loading ? <LoadingState label="날짜별 출결 정보를 불러오는 중입니다..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
      <section className="rounded-2xl border border-stone-200/80 bg-[#fffefa] px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/7 text-accent">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">선택일 수련 현황</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-lg font-bold tracking-tight text-primary sm:text-xl">{formatFullDateWithWeekday(selectedDate)}</h2>
                {getDayOffLabel(selectedDate) && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">{getDayOffLabel(selectedDate)}</span>
                )}
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-primary hover:text-primary"
                >
                  <FileDown className="h-4 w-4" />
                  PDF 출력
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">달력에서 날짜를 선택해 일별 출결을 확인하세요.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-end rounded-xl bg-primary/5 px-4 py-3 sm:self-auto">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-stone-500">함께한 수련생</p>
              <p className="text-lg font-bold text-primary">{selectedStats.presentCount}명</p>
              {!selectedStats.historical && <p className="text-xs text-stone-500">추가 출석 {selectedStats.additionalPresent}명 포함</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label={selectedStats.historical ? "당시 수업 대상" : "수업 대상"} value={selectedStats.scheduledCount === null ? "—" : `${selectedStats.scheduledCount}명`} icon={Users} tone="primary" />
        <StatCard label="출석 인원" value={`${selectedStats.presentCount}명`} icon={UserCheck} tone="success" />
        <StatCard label={selectedStats.historical ? "기록된 결석" : "대상 중 체크 전"}
          value={`${selectedStats.historical ? selectedStats.absentCount : selectedStats.notCheckedCount}명`} icon={UserX} tone="neutral"
          footer={!selectedStats.historical ? <span className="text-xs text-slate-500">대상 중 결석 {selectedStats.absentCount}명</span> : undefined} />
        <StatCard
          label="수업 대상 출석률"
          value={selectedStats.attendanceRate === null ? "—" : `${selectedStats.attendanceRate}%`}
          icon={TrendingUp}
          tone="primary"
          footer={selectedStats.attendanceRate !== null ? <ProgressBar percent={selectedStats.attendanceRate} /> : <span className="text-xs text-slate-500">{selectedStats.historical ? "과거 수업 일정 이력 없음" : "수업 대상 없음"}</span>}
        />
      </div>

      <AttendanceCalendar
        month={displayedMonth}
        selectedDate={selectedDate}
        summaries={summaries}
        onSelectDate={setSelectedDate}
        onChangeMonth={handleChangeMonth}
      />
      </>}
      <ReportRangeModal open={reportOpen} onClose={() => setReportOpen(false)} defaultDate={selectedDate} onSubmit={handlePdfExport} />
    </div>
  );
}
