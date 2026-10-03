"use client";

import { useMemo, useState } from "react";
import { useStudents } from "@/context/students-context";
import { useToast } from "@/components/ui/toast-provider";
import { StudentHasAttendanceError } from "@/services/student-service";
import { StudentsToolbar } from "@/components/students/students-toolbar";
import { StudentsTable } from "@/components/students/students-table";
import { StudentCardList } from "@/components/students/student-card-list";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { StudentDetailModal } from "@/components/students/student-detail-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-states";
import type { Student, StudentInput } from "@/types/student";
import { PageHeading } from "@/components/layout/page-heading";

type FormModalState = { mode: "create" } | { mode: "edit"; student: Student } | null;

export function StudentsView() {
  const { students, loading, error, addStudent, editStudent, removeStudent, refresh } = useStudents();
  const { notify } = useToast();

  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (keyword === "") return students;
    return students.filter((student) => student.name.toLowerCase().includes(keyword));
  }, [students, search]);

  async function handleFormSubmit(input: StudentInput) {
    setSubmitting(true);
    try {
      if (formModal?.mode === "edit") {
        await editStudent(formModal.student.id, input);
        notify(`${input.name} 학생 정보가 수정되었습니다.`);
      } else {
        await addStudent(input);
        notify(`${input.name} 학생이 등록되었습니다.`);
      }
      setFormModal(null);
    } catch {
      notify("저장 중 오류가 발생했습니다. 다시 시도해주세요.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDetailStudent(null);
    try {
      await removeStudent(target.id);
      notify(`${target.name} 학생이 삭제되었습니다.`);
    } catch (err) {
      const message =
        err instanceof StudentHasAttendanceError ? err.message : "삭제 중 오류가 발생했습니다.";
      notify(message, "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading eyebrow="GROWING TOGETHER" title="수련생 관리" description="함께 땀 흘리고 성장하는 우리 도장의 수련생들입니다." action={!loading && !error ? <span className="rounded-lg border border-stone-200 bg-[#fffefa] px-4 py-2 text-sm text-stone-500">전체 수련생 <strong className="ml-2 text-primary">{students.length}명</strong></span> : undefined} />

      <StudentsToolbar search={search} onSearchChange={setSearch} onCreate={() => setFormModal({ mode: "create" })} />

      {loading ? (
        <LoadingState label="학생 정보를 불러오는 중입니다..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다"
          description="검색어 또는 필터 조건을 변경해보세요."
        />
      ) : (
        <>
          <StudentsTable
            students={filteredStudents}
            onView={setDetailStudent}
            onEdit={(student) => setFormModal({ mode: "edit", student })}
            onDelete={setDeleteTarget}
          />
          <StudentCardList
            students={filteredStudents}
            onView={setDetailStudent}
            onEdit={(student) => setFormModal({ mode: "edit", student })}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      <StudentFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? "create"}
        initialStudent={formModal?.mode === "edit" ? formModal.student : undefined}
        submitting={submitting}
        onClose={() => setFormModal(null)}
        onSubmit={handleFormSubmit}
      />

      <StudentDetailModal
        student={detailStudent}
        onClose={() => setDetailStudent(null)}
        onEdit={(student) => {
          setDetailStudent(null);
          setFormModal({ mode: "edit", student });
        }}
        onDelete={setDeleteTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="학생 삭제"
        description={`${deleteTarget?.name ?? ""} 학생 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
