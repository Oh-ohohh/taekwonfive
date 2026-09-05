"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { FormField, SelectField, TextAreaField, TextField } from "@/components/ui/form-fields";
import { CLASS_GROUPS, type Student, type StudentInput } from "@/types/student";
import { getTodayDateString } from "@/lib/date";

function emptyInput(): StudentInput {
  return {
    name: "",
    birthDate: "",
    school: "",
    grade: "",
    gender: "남",
    belt: "",
    classGroup: "1부",
    guardianName: "",
    guardianPhone: "",
    registrationDate: getTodayDateString(),
    notes: "",
    active: true,
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
  const [form, setForm] = useState<StudentInput>(emptyInput());

  useEffect(() => {
    if (!open) return;
    // Deferred via a microtask so this reset doesn't synchronously trigger
    // setState from within the effect.
    queueMicrotask(() => {
      setForm(initialStudent ? { ...initialStudent } : emptyInput());
    });
  }, [open, initialStudent]);

  function update<K extends keyof StudentInput>(key: K, value: StudentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
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
          <FormField label="생년월일" htmlFor="birthDate" required>
            <TextField
              id="birthDate"
              type="date"
              required
              value={form.birthDate}
              onChange={(e) => update("birthDate", e.target.value)}
            />
          </FormField>
          <FormField label="학교" htmlFor="school" required>
            <TextField
              id="school"
              required
              value={form.school}
              onChange={(e) => update("school", e.target.value)}
              placeholder="예: 한빛초등학교"
            />
          </FormField>
          <FormField label="학년" htmlFor="grade" required>
            <TextField
              id="grade"
              required
              value={form.grade}
              onChange={(e) => update("grade", e.target.value)}
              placeholder="예: 3학년"
            />
          </FormField>
          <FormField label="성별" htmlFor="gender" required>
            <SelectField
              id="gender"
              value={form.gender}
              onChange={(e) => update("gender", e.target.value as StudentInput["gender"])}
            >
              <option value="남">남</option>
              <option value="여">여</option>
            </SelectField>
          </FormField>
          <FormField label="띠 또는 품·단" htmlFor="belt" required>
            <TextField
              id="belt"
              required
              value={form.belt}
              onChange={(e) => update("belt", e.target.value)}
              placeholder="예: 7급 (노랑띠), 2품, 1단"
            />
          </FormField>
          <FormField label="수업부" htmlFor="classGroup" required>
            <SelectField
              id="classGroup"
              value={form.classGroup}
              onChange={(e) => update("classGroup", e.target.value as StudentInput["classGroup"])}
            >
              {CLASS_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </SelectField>
          </FormField>
          <FormField label="등록일" htmlFor="registrationDate" required>
            <TextField
              id="registrationDate"
              type="date"
              required
              value={form.registrationDate}
              onChange={(e) => update("registrationDate", e.target.value)}
            />
          </FormField>
          <FormField label="보호자 이름" htmlFor="guardianName" required>
            <TextField
              id="guardianName"
              required
              value={form.guardianName}
              onChange={(e) => update("guardianName", e.target.value)}
              placeholder="예: 김태호"
            />
          </FormField>
          <FormField label="보호자 연락처" htmlFor="guardianPhone" required>
            <TextField
              id="guardianPhone"
              required
              value={form.guardianPhone}
              onChange={(e) => update("guardianPhone", e.target.value)}
              placeholder="010-0000-0000"
            />
          </FormField>
        </div>

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
