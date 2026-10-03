"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Student } from "@/types/student";
import { formatBeltLabel } from "@/types/student";
import { formatDateDots, formatDateTimeDots } from "@/lib/date";
import { formatAttendanceDays } from "@/lib/student-schedule";

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
          <div className="mb-2">
            <p className="text-lg font-bold text-slate-900">{student.name}</p>
            <p className="text-xs text-slate-400">{formatBeltLabel(student.grade, student.poom)}</p>
          </div>

          <div className="divide-y divide-slate-100">
            <Row label="생년월일" value={student.birthDate ? formatDateDots(student.birthDate) : "-"} />
            <Row label="학교" value={student.school ?? "-"} />
            <Row label="성별" value={student.gender ?? "-"} />
            <Row label="급/품" value={formatBeltLabel(student.grade, student.poom)} />
            <Row label="출석 요일" value={formatAttendanceDays(student.attendanceDays)} />
            <Row label="보호자" value={student.guardianName ?? "-"} />
            <Row label="등록일" value={formatDateTimeDots(student.createdAt)} />
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
