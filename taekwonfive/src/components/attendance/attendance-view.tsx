"use client";

import { useMemo, useState } from "react";
import { useAttendance } from "@/context/attendance-context";
import { useToast } from "@/components/ui/toast-provider";
import { AttendanceToolbar, type AttendanceStatusFilter } from "@/components/attendance/attendance-toolbar";
import { AttendanceRow } from "@/components/attendance/attendance-row";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-states";
import type { AttendanceEntry, ClassSession } from "@/types/attendance";
import { PageHeading } from "@/components/layout/page-heading";
import { getAttendanceRosterSummary, getVisibleAttendanceEntries, isAttending, type AttendanceScope } from "@/lib/attendance-roster";
import { getScheduleState, isStudentOnLeave, isStudentScheduled } from "@/lib/student-schedule";
import { getKoreaDateString } from "@/lib/date";
import { getDayOffLabel } from "@/lib/holidays";

export function AttendanceView() {
  const { entries, loading, error, refresh, selectedDate, setSelectedDate, setStatus, resetStatus, setClassSession } =
    useAttendance();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("all");
  const [scope, setScope] = useState<AttendanceScope>("scheduled");
  const today = getKoreaDateString();
  const summary = useMemo(() => getAttendanceRosterSummary(entries, selectedDate, today), [entries, selectedDate, today]);
  // 공휴일·주말은 수업 대상이 없어 출석 체크가 필요 없다. 나온 학생만 전체 학생에서 추가한다.
  const dayOffLabel = getDayOffLabel(selectedDate);
  const showDayOff = dayOffLabel !== null && !summary.historical;

  const filteredEntries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return getVisibleAttendanceEntries(entries, selectedDate, scope, today).filter((entry) => {
      const matchesKeyword = keyword === "" || entry.student.name.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present" ? isAttending(entry.status)
          : statusFilter === "not_checked" ? entry.status === "not_checked" && (selectedDate < today ? !isStudentOnLeave(entry.student) : isStudentScheduled(entry.student, selectedDate))
          : entry.status === statusFilter);
      return matchesKeyword && matchesStatus;
    });
  }, [entries, search, statusFilter, selectedDate, scope, today]);

  async function handleToggle(entry: AttendanceEntry) {
    if (entry.pending) return;
    try {
      if (isAttending(entry.status)) {
        await resetStatus(entry.student.id);
        notify(`${entry.student.name} 학생의 출석 체크를 해제했습니다.`);
      } else {
        const result = await setStatus(entry.student.id, "present");
        notify(result.classSession
          ? `${result.student.name} 학생이 ${result.classSession}부로 출석 처리되었습니다.`
          : `${result.student.name} 학생이 출석 처리되었습니다. 수업 부를 선택해주세요.`);
      }
    } catch {
      notify("출석 상태 변경 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    }
  }

  async function handleClassSessionChange(entry: AttendanceEntry, classSession: ClassSession | null) {
    if (entry.pending || entry.classSession === classSession) return;
    try {
      await setClassSession(entry.student.id, classSession);
      notify(classSession
        ? `${entry.student.name} 학생의 수업을 ${classSession}부로 변경했습니다.`
        : `${entry.student.name} 학생의 수업 부 선택을 해제했습니다.`);
    } catch {
      notify("수업 부를 저장하지 못했습니다. 다시 시도해주세요.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading eyebrow="SHOW UP. GROW STRONG." title={summary.historical ? "출석 기록" : "오늘의 출석"} description="날짜에 맞는 수업 대상을 확인하고, 이름을 눌러 출석을 체크하세요." />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-sky-100 bg-white px-4 py-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" />출석 완료</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />다른 요일 수업</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-400" />휴관</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-400" />휴일(주말·공휴일)</span>
        <span className="sm:ml-auto">이름을 다시 누르면 출석이 해제됩니다. 이름 옆에서 수업 부를 바꿀 수 있어요.</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">수업 시작 10분 전부터 자동 지정됩니다. 시간 공백이나 과거 날짜의 출석은 부를 직접 선택해주세요.</p>

      <AttendanceToolbar
        search={search}
        onSearchChange={setSearch}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        historical={summary.historical}
        dayOffLabel={dayOffLabel}
      />

      {dayOffLabel && (
        <div className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center">
          <p>
            <span className="font-bold">{dayOffLabel === "휴일" ? "주말 휴일" : `${dayOffLabel} (공휴일)`}</span>
            {" "}— 출석 체크가 필요 없습니다. 출석한 학생이 있으면 전체 학생에서 추가해주세요.
          </p>
          {scope !== "all" && (
            <button type="button" onClick={() => setScope("all")}
              className="shrink-0 self-start rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 sm:ml-auto sm:self-auto">
              전체 학생에서 추가
            </button>
          )}
        </div>
      )}

      {!loading && !error && (
        <>
          <dl className={`grid gap-2.5 ${summary.historical || showDayOff ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {(showDayOff
              ? [{ label: "휴일 출석", value: summary.presentCount }]
              : summary.historical
              ? [{ label: "출석 인원", value: summary.presentCount }, { label: "기록된 결석", value: summary.absentCount }]
              : [{ label: "수업 대상", value: summary.scheduledCount }, { label: "대상 중 출석", value: summary.scheduledPresent },
                { label: "대상 중 체크 전", value: summary.notCheckedCount }, { label: "추가 출석", value: summary.additionalPresent }]
            ).map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-xl font-bold text-slate-800">{value}명</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-relaxed text-slate-500">
            {showDayOff
              ? "휴일에는 수업 대상이 없어 체크 전·결석을 집계하지 않습니다."
              : summary.historical
              ? "과거 날짜는 저장된 출결 기록을 표시합니다. 당시 수업 대상과 출석률은 계산하지 않습니다."
              : `전체 출석 ${summary.presentCount}명 · 대상 중 결석 ${summary.absentCount}명. 휴관 학생과 다른 요일 학생은 수업 대상에 포함되지 않습니다.`}
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="출석 명단 범위">
        {(["scheduled", "all"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={scope === value} onClick={() => setScope(value)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${scope === value ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600"}`}>
            {value === "all" ? "전체 학생" : summary.historical ? "출결 기록" : "수업 대상"}
          </button>
        ))}
        <span className="text-xs text-slate-500">보강은 전체 학생에서 체크하세요. 출석요일이 아닌 학생은 칸 색으로 구분되며, 그대로 출석 체크할 수 있습니다.</span>
      </div>

      {loading ? (
        <LoadingState label="출석 정보를 불러오는 중입니다..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title={search || statusFilter !== "all" ? "검색 결과가 없습니다" : showDayOff && scope === "scheduled" ? "휴일이라 출석 체크가 필요 없습니다" : summary.historical && scope === "scheduled" ? "저장된 출결 기록이 없습니다" : "해당 날짜의 수업 대상이 없습니다"}
          description="검색 조건을 바꾸거나 전체 학생에서 출석할 학생을 확인해주세요."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredEntries.map((entry) => {
            // 과거 날짜도 현재 출석요일 기준으로 칸 색을 구분한다(통계에는 반영하지 않음).
            const scheduleState = getScheduleState(entry.student, selectedDate);
            return (
              <AttendanceRow key={entry.student.id} entry={entry} onToggle={handleToggle} onClassSessionChange={handleClassSessionChange}
                scheduleState={scheduleState}
                attendanceNote={scheduleState === "on_leave" ? (summary.historical ? "현재 휴관 중" : "휴관 중 · 출석 가능")
                  : scheduleState === "off_day" ? (isAttending(entry.status) ? "추가 출석" : "다른 요일 수업")
                  : scheduleState === "day_off" && isAttending(entry.status) ? "휴일 출석" : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
