"use client";

import { Plus, Search } from "lucide-react";
import { CLASS_GROUPS, type ClassGroup } from "@/types/student";

type ClassGroupFilter = "all" | ClassGroup;

export function StudentsToolbar({
  search,
  onSearchChange,
  classGroupFilter,
  onClassGroupFilterChange,
  onCreate,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  classGroupFilter: ClassGroupFilter;
  onClassGroupFilterChange: (value: ClassGroupFilter) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="학생 이름 검색"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <select
        value={classGroupFilter}
        onChange={(e) => onClassGroupFilterChange(e.target.value as ClassGroupFilter)}
        className="h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="all">전체 수업부</option>
        {CLASS_GROUPS.map((group) => (
          <option key={group} value={group}>
            {group}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onCreate}
        className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        학생 등록
      </button>
    </div>
  );
}
