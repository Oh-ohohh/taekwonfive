"use client";

import { CalendarDays, TrendingUp, UserCheck, Users, UserX } from "lucide-react";
import { useStudents } from "@/context/students-context";
import { useAttendance } from "@/context/attendance-context";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentAttendanceList } from "@/components/dashboard/recent-attendance-list";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LoadingState, ErrorState } from "@/components/ui/data-states";
import { formatFullDateWithWeekday } from "@/lib/date";

export function DashboardView() {
  const { loading: studentsLoading, error: studentsError, refresh: refreshStudents } = useStudents();
  const { stats, recentlyAttended, loading: attendanceLoading, error: attendanceError, refresh: refreshAttendance } =
    useAttendance();

  const loading = studentsLoading || attendanceLoading;
  const error = studentsError || attendanceError;

  if (loading) return <LoadingState label="대시보드를 불러오는 중입니다..." />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          refreshStudents();
          refreshAttendance();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <CalendarDays className="h-4 w-4" />
          {formatFullDateWithWeekday()}
        </div>
        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">대시보드</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="등록 학생 수" value={`${stats.registeredCount}명`} icon={Users} tone="primary" />
        <StatCard label="오늘 출석 인원" value={`${stats.presentCount}명`} icon={UserCheck} tone="success" />
        <StatCard label="미출석 인원" value={`${stats.absentCount}명`} icon={UserX} tone="accent" />
        <StatCard
          label="오늘 출석률"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          tone="neutral"
          footer={<ProgressBar percent={stats.attendanceRate} />}
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-slate-800">최근 출석한 학생</h2>
        <div className="mt-1">
          <RecentAttendanceList entries={recentlyAttended} />
        </div>
      </div>
    </div>
  );
}
