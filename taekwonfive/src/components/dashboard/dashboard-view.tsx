"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, FileDown, TrendingUp, UserCheck, Users, UserX } from "lucide-react";
import { useAttendance, useMonthlyAttendanceSummary, useTodayAttendanceSummary } from "@/context/attendance-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AttendanceCalendar, type CalendarDaySummary } from "@/components/dashboard/attendance-calendar";
import { LoadingState, ErrorState } from "@/components/ui/data-states";
import { formatFullDateWithWeekday, getKoreaDateString, getKoreaMonthString } from "@/lib/date";
import { getDayOffLabel } from "@/lib/holidays";
import type { AttendanceRecord } from "@/types/attendance";
import { PageHeading } from "@/components/layout/page-heading";
import { DojangBanner } from "@/components/dashboard/dojang-banner";
import { buildAttendanceEntries, getAttendanceRosterSummary, isAttending } from "@/lib/attendance-roster";
import { ReportRangeModal } from "@/components/dashboard/report-range-modal";

export function DashboardView() {
  const today = getKoreaDateString();
  const [displayedMonth, setDisplayedMonth] = useState(getKoreaMonthString());
  const { students, records, loading, error, refresh } = useMonthlyAttendanceSummary(displayedMonth);
  // 위쪽 현황은 달력과 관계없이 항상 오늘 기준이다.
  const { todayRoster, loading: todayLoading, error: todayError, refresh: refreshToday } = useTodayAttendanceSummary();
  const todayDayOffLabel = getDayOffLabel(today);
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();
  const { setSelectedDate: setAttendanceDate } = useAttendance();

  // 달력 날짜를 누르면 그날의 출석 체크 화면으로 이동한다.
  function handleSelectDate(date: string) {
    setAttendanceDate(date);
    router.push("/attendance");
  }

  const recordsByDate = useMemo(() => {
    const grouped = new Map<string, AttendanceRecord[]>();
    records.forEach((record) => {
      const current = grouped.get(record.date) ?? [];
      current.push(record);
      grouped.set(record.date, current);
    });
    return grouped;
  }, [records]);

  // 출석률 = 그날 수업 대상 중 출석 비율. 과거 날짜도 현재 출석요일 기준으로 계산한다.
  const summaries = useMemo(() => {
    const next = new Map<string, CalendarDaySummary>();
    recordsByDate.forEach((dateRecords, date) => {
      next.set(date, {
        attendingCount: dateRecords.filter((record) => isAttending(record.status)).length,
        attendanceRate: getAttendanceRosterSummary(buildAttendanceEntries(students, dateRecords), date, date).attendanceRate,
      });
    });
    return next;
  }, [recordsByDate, students]);

  function handlePdfExport(startDate: string, endDate: string) {
    const params = new URLSearchParams({ start: startDate, end: endDate, print: "1" });
    window.open(`/attendance/report?${params}`, "_blank", "noopener,noreferrer");
    setReportOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeading eyebrow="OUR DOJANG, AT A GLANCE" title="우리 도장 한눈에" description="수련생의 오늘을 살피고, 매일의 성장을 함께하세요." />
      <DojangBanner />
      {todayLoading ? <LoadingState label="오늘의 출결 정보를 불러오는 중입니다..." /> : todayError || !todayRoster ? <ErrorState message={todayError ?? "오늘의 출결 정보를 불러오지 못했습니다."} onRetry={refreshToday} /> : <>
      <section className="rounded-2xl border border-stone-200/80 bg-[#fffefa] px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${todayDayOffLabel ? "bg-rose-50 text-rose-500" : "bg-accent/7 text-accent"}`}>
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-stone-500">오늘의 수련 현황</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className={`text-lg font-bold tracking-tight sm:text-xl ${todayDayOffLabel ? "text-rose-600" : "text-primary"}`}>{formatFullDateWithWeekday(today)}</h2>
                {todayDayOffLabel && (
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">{todayDayOffLabel}</span>
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
              <p className="mt-1 text-xs leading-relaxed text-stone-500">달력에서 날짜를 누르면 그날의 출석 체크로 이동합니다.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-end rounded-xl bg-primary/5 px-4 py-3 sm:self-auto">
            <UserCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium text-stone-500">함께한 수련생</p>
              <p className="text-lg font-bold text-primary">{todayRoster.presentCount}명</p>
              <p className="text-xs text-stone-500">추가 출석 {todayRoster.additionalPresent}명 포함</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="수업 대상" value={`${todayRoster.scheduledCount ?? 0}명`} icon={Users} tone="primary" />
        <StatCard label="출석 인원" value={`${todayRoster.presentCount}명`} icon={UserCheck} tone="success" />
        <StatCard label="대상 중 체크 전" value={`${todayRoster.notCheckedCount ?? 0}명`} icon={UserX} tone="neutral"
          footer={<span className="text-xs text-slate-500">대상 중 결석 {todayRoster.absentCount}명</span>} />
        <StatCard
          label="수업 대상 출석률"
          value={todayRoster.attendanceRate === null ? "—" : `${todayRoster.attendanceRate}%`}
          icon={TrendingUp}
          tone="primary"
          footer={todayRoster.attendanceRate !== null ? <ProgressBar percent={todayRoster.attendanceRate} /> : <span className="text-xs text-slate-500">{todayDayOffLabel ? "휴일" : "수업 대상 없음"}</span>}
        />
      </div>
      </>}

      {loading ? <LoadingState label="날짜별 출결 정보를 불러오는 중입니다..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : <>
      <AttendanceCalendar
        month={displayedMonth}
        summaries={summaries}
        onSelectDate={handleSelectDate}
        onChangeMonth={setDisplayedMonth}
      />
      </>}
      <ReportRangeModal open={reportOpen} onClose={() => setReportOpen(false)} defaultDate={today} onSubmit={handlePdfExport} />
    </div>
  );
}
