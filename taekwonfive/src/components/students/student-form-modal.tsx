"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { FormField, SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import type { AttendanceWeekday, Gender, Student, StudentInput } from "@/types/student";
import { ATTENDANCE_WEEKDAYS } from "@/lib/student-schedule";

/** Controlled fields; empty weekdays represent a student on leave. */
type StudentFormState = {
  name: string;
  birthDate: string;
  school: string;
  gender: Gender | "";
  grade: string;
  poom: string;
  guardianName: string;
  notes: string;
  attendanceDays: AttendanceWeekday[];
};

function emptyForm(): StudentFormState {
  return {
    name: "",
    birthDate: "",
    school: "",
    gender: "",
    grade: "",
    poom: "",
    guardianName: "",
    notes: "",
    attendanceDays: [],
  };
}

function studentToForm(student: Student): StudentFormState {
  return {
    name: student.name,
    birthDate: student.birthDate ?? "",
    school: student.school ?? "",
    gender: student.gender ?? "",
    grade: student.grade ?? "",
    poom: student.poom ?? "",
    guardianName: student.guardianName ?? "",
    notes: student.notes ?? "",
    attendanceDays: student.attendanceDays ?? [],
  };
}

function formToInput(form: StudentFormState): StudentInput {
  return {
    name: form.name.trim(),
    birthDate: form.birthDate || null,
    school: form.school.trim() || null,
    gender: form.gender || null,
    grade: form.grade.trim() || null,
    poom: form.poom.trim() || null,
    guardianName: form.guardianName.trim() || null,
    notes: form.notes.trim() || null,
    attendanceDays: form.attendanceDays.length ? form.attendanceDays : null,
  };
}

type StudentFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initialStudent?: Student;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: StudentInput) => void;
};

export function StudentFormModal({
  open,
  mode,
  initialStudent,
  submitting = false,
  onClose,
  onSubmit,
}: StudentFormModalProps) {
  const [form, setForm] = useState<StudentFormState>(emptyForm());

  useEffect(() => {
    if (!open) return;
    // Deferred via a microtask so this reset doesn't synchronously trigger
    // setState from within the effect.
    queueMicrotask(() => {
      setForm(initialStudent ? studentToForm(initialStudent) : emptyForm());
    });
  }, [open, initialStudent]);

  function update<K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(formToInput(form));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "학생 등록" : "학생 정보 수정"}
      widthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="학생 이름" htmlFor="name" required>
            <TextField
              id="name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="예: 김민준"
            />
          </FormField>
          <FormField label="생년월일" htmlFor="birthDate">
            <TextField
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </FormField>
          <FormField label="학교" htmlFor="school">
            <TextField
              id="school"
              value={form.school}
              onChange={(e) => update("school", e.target.value)}
              placeholder="예: 한빛초등학교"
            />
          </FormField>
          <FormField label="성별" htmlFor="gender">
            <SelectField
              id="gender"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as StudentFormState["gender"])}
            >
              <option value="">선택 안함</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </SelectField>
          </FormField>
          <FormField label="급" htmlFor="grade">
            <TextField
              id="grade"
              value={form.grade}
              onChange={(e) => update("grade", e.target.value)}
              placeholder="예: 8 (숫자만, 해당 없으면 비워두세요)"
            />
          </FormField>
          <FormField label="품" htmlFor="poom">
            <TextField
              id="poom"
              value={form.poom}
              onChange={(e) => update("poom", e.target.value)}
              placeholder="예: 2 (숫자만, 해당 없으면 비워두세요)"
            />
          </FormField>
          <FormField label="보호자 이름" htmlFor="guardianName">
            <TextField
              id="guardianName"
              value={form.guardianName}
              onChange={(e) => update("guardianName", e.target.value)}
              placeholder="예: 김태호"
            />
          </FormField>
        </div>

        <fieldset disabled={submitting} className="rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold text-slate-700">출석 요일</legend>
          <div className="flex flex-wrap gap-2">
            {ATTENDANCE_WEEKDAYS.map(({ value, label }) => (
              <label key={value} className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm ${form.attendanceDays.includes(value) ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600"}`}>
                <input type="checkbox" checked={form.attendanceDays.includes(value)}
                  onChange={(event) => update("attendanceDays", event.target.checked
                    ? [...form.attendanceDays, value].sort((a, b) => a - b)
                    : form.attendanceDays.filter((day) => day !== value))}
                  className="accent-primary" />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <button type="button" onClick={() => update("attendanceDays", [1, 2, 3, 4, 5])} className="font-semibold text-primary">월~금 선택</button>
            <button type="button" onClick={() => update("attendanceDays", [])} className="text-slate-500">휴관으로 설정</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{form.attendanceDays.length ? "선택한 요일의 출석 대상에 포함됩니다." : "휴관 중입니다. 합류할 때 요일을 지정하면 출석 대상에 포함됩니다."}</p>
        </fieldset>

        <FormField label="특이사항" htmlFor="notes">
          <TextAreaField
            id="notes"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="알레르기, 형제 할인 등 참고 사항"
          />
        </FormField>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "저장 중..." : mode === "create" ? "등록하기" : "수정하기"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
