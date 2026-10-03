"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Student } from "@/types/student";
import { formatBeltLabel } from "@/types/student";
import { formatDateDots, formatDateTimeDots } from "@/lib/date";
import { formatAttendanceDays } from "@/lib/student-schedule";

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
    <div className="hidden overflow-x-auto rounded-2xl border border-stone-200/80 bg-[#fffefa] md:block">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-100/60 text-xs text-stone-500">
            <th className="px-4 py-3 font-medium">이름</th>
            <th className="px-4 py-3 font-medium">학교</th>
            <th className="px-4 py-3 font-medium">급/품</th>
            <th className="px-4 py-3 font-medium">출석 요일</th>
            <th className="px-4 py-3 font-medium">성별</th>
            <th className="px-4 py-3 font-medium">보호자</th>
            <th className="px-4 py-3 font-medium">등록일</th>
            <th className="px-4 py-3 font-medium text-right">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {students.map((student) => (
            <tr key={student.id} className="text-slate-700 hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <span className="font-semibold text-slate-900">{student.name}</span>
                {student.birthDate && (
                  <p className="text-xs text-slate-400">{formatDateDots(student.birthDate)}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500">{student.school ?? "-"}</td>
              <td className="px-4 py-3 text-slate-500">{formatBeltLabel(student.grade, student.poom)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatAttendanceDays(student.attendanceDays)}</td>
              <td className="px-4 py-3 text-slate-500">{student.gender ?? "-"}</td>
              <td className="px-4 py-3 text-slate-500">{student.guardianName ?? "-"}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateTimeDots(student.createdAt)}</td>
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
