"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { AttendanceEntry } from "@/types/attendance";

/** 결석·기타 메모. 비워 두고 저장해도 된다. */
export function AttendanceNoteModal({
  entry,
  onClose,
  onSave,
}: {
  entry: AttendanceEntry | null;
  onClose: () => void;
  onSave: (entry: AttendanceEntry, note: string | null) => Promise<void>;
}) {
  return (
    <Modal open={entry !== null} onClose={onClose} title={entry ? `${entry.student.name} ${entry.status === "other" ? "기타" : "결석"} 메모` : ""}>
      {/* key: 다른 학생을 열면 입력값을 새로 시작한다. */}
      {entry && <NoteForm key={`${entry.student.id}|${entry.status}`} entry={entry} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function NoteForm({ entry, onClose, onSave }: {
  entry: AttendanceEntry;
  onClose: () => void;
  onSave: (entry: AttendanceEntry, note: string | null) => Promise<void>;
}) {
  const [note, setNote] = useState(entry.note ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(entry, note.trim() || null);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        maxLength={200}
        autoFocus
        placeholder={entry.status === "other" ? "예: 상담, 조퇴, 개인 사정 (선택)" : "예: 감기, 가족 여행 (선택)"}
        aria-label="메모"
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <p className="text-xs text-slate-500">메모는 선택 사항입니다. 비워 두고 닫아도 됩니다.</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
          닫기
        </button>
        <button type="submit" disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
