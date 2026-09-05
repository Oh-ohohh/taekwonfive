"use client";

import { useMemo, useState } from "react";
import { useAttendance } from "@/context/attendance-context";
import { useToast } from "@/components/ui/toast-provider";
import { AttendanceToolbar } from "@/components/attendance/attendance-toolbar";
import { AttendanceRow } from "@/components/attendance/attendance-row";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-states";
import type { ClassGroup } from "@/types/student";
import { ATTENDANCE_STATUS_LABEL, type AttendanceStatus } from "@/types/attendance";

export function AttendanceView() {
  const { entries, loading, error, refresh, setStatus } = useAttendance();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const [classGroupFilter, setClassGroupFilter] = useState<"all" | ClassGroup>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AttendanceStatus>("all");

  const filteredEntries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesKeyword = keyword === "" || entry.student.name.toLowerCase().includes(keyword);
      const matchesClassGroup =
        classGroupFilter === "all" || entry.student.classGroup === classGroupFilter;
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      return matchesKeyword && matchesClassGroup && matchesStatus;
    });
  }, [entries, search, classGroupFilter, statusFilter]);

  async function handleChangeStatus(studentId: string, status: AttendanceStatus) {
    try {
      const result = await setStatus(studentId, status);
      notify(`${result.student.name} 학생이 ${ATTENDANCE_STATUS_LABEL[status]} 처리되었습니다.`);
    } catch {
      notify("출석 상태 변경 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">출석체크</h1>
        <p className="mt-0.5 text-sm text-slate-500">학생별 오늘의 출석 상태를 기록합니다.</p>
      </div>

      <AttendanceToolbar
        search={search}
        onSearchChange={setSearch}
        classGroupFilter={classGroupFilter}
        onClassGroupFilterChange={setClassGroupFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <LoadingState label="출석 정보를 불러오는 중입니다..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filteredEntries.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다" description="검색어 또는 필터 조건을 변경해보세요." />
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredEntries.map((entry) => (
            <AttendanceRow key={entry.student.id} entry={entry} onChangeStatus={handleChangeStatus} />
          ))}
        </ul>
      )}
    </div>
  );
}
