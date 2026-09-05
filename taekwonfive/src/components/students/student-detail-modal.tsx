"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Student } from "@/types/student";
import { formatDateDots } from "@/lib/date";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function StudentDetailModal({
  student,
  onClose,
  onEdit,
  onDelete,
}: {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}) {
  return (
    <Modal open={student !== null} onClose={onClose} title="학생 상세정보">
      {student && (
        <div className="flex flex-col gap-1">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">{student.name}</p>
              <p className="text-xs text-slate-400">{student.classGroup} · {student.belt}</p>
            </div>
            {!student.active && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                휴회중
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            <Row label="생년월일" value={formatDateDots(student.birthDate)} />
            <Row label="학교 / 학년" value={`${student.school} · ${student.grade}`} />
            <Row label="성별" value={student.gender} />
            <Row label="띠 / 품·단" value={student.belt} />
            <Row label="수업부" value={student.classGroup} />
            <Row label="보호자" value={student.guardianName} />
            <Row label="보호자 연락처" value={student.guardianPhone} />
            <Row label="등록일" value={formatDateDots(student.registrationDate)} />
          </div>

          {student.notes && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {student.notes}
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => onDelete(student)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" />
              수정
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
