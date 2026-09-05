"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/types/student";
import { formatDateDots } from "@/lib/date";

export function StudentsTable({
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
    <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm md:block">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400">
            <th className="px-4 py-3 font-medium">이름</th>
            <th className="px-4 py-3 font-medium">학교 및 학년</th>
            <th className="px-4 py-3 font-medium">띠/품·단</th>
            <th className="px-4 py-3 font-medium">수업부</th>
            <th className="px-4 py-3 font-medium">보호자 연락처</th>
            <th className="px-4 py-3 font-medium">등록일</th>
            <th className="px-4 py-3 font-medium text-right">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {students.map((student) => (
            <tr key={student.id} className="text-slate-700 hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{student.name}</span>
                  {!student.active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      휴회중
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {student.school} · {student.grade}
              </td>
              <td className="px-4 py-3 text-slate-500">{student.belt}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {student.classGroup}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">{student.guardianPhone}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateDots(student.registrationDate)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label="상세보기"
                    onClick={() => onView(student)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="수정"
                    onClick={() => onEdit(student)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => onDelete(student)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
