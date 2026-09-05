"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/types/student";
import { formatDateDots } from "@/lib/date";

export function StudentCardList({
  students,
  onView,
  onEdit,
  onDelete,
}: {
  students: Student[];
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  return (
    <ul className="flex flex-col gap-3 md:hidden">
      {students.map((student) => (
        <li key={student.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-bold text-slate-900">{student.name}</p>
                {!student.active && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    휴회중
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {student.school} · {student.grade}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {student.classGroup}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-slate-500">
            <span>띠/품·단</span>
            <span className="text-right font-medium text-slate-700">{student.belt}</span>
            <span>보호자 연락처</span>
            <span className="text-right font-medium text-slate-700">{student.guardianPhone}</span>
            <span>등록일</span>
            <span className="text-right font-medium text-slate-700">
              {formatDateDots(student.registrationDate)}
            </span>
          </div>

          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onView(student)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 active:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" />
              상세보기
            </button>
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 active:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              수정
            </button>
            <button
              type="button"
              onClick={() => onDelete(student)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 text-xs font-medium text-red-600 active:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              삭제
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
