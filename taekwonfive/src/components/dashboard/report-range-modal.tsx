"use client";

import { useState, type FormEvent } from "react";
import { FileDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField, TextField } from "@/components/ui/form-fields";
import { MAX_REPORT_DAYS } from "@/lib/attendance-roster";
import { getDateRangeDates, getKoreaDateString } from "@/lib/date";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 대시보드에서 선택한 날짜. 그 달 1일 ~ 이 날짜를 기본 기간으로 채운다. */
  defaultDate: string;
  onSubmit: (startDate: string, endDate: string) => void;
};

export function ReportRangeModal({ open, onClose, defaultDate, onSubmit }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="PDF 출력 기간 선택" widthClassName="max-w-md">
      <ReportRangeForm defaultDate={defaultDate} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}

// Modal이 닫히면 언마운트되므로, 열 때마다 기본 기간으로 다시 채워진다.
function ReportRangeForm({ defaultDate, onSubmit, onCancel }: { defaultDate: string; onSubmit: Props["onSubmit"]; onCancel: () => void }) {
  const today = getKoreaDateString();
  const [startDate, setStartDate] = useState(`${defaultDate.slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(defaultDate);

  const error = !startDate || !endDate ? "시작일과 종료일을 모두 선택해주세요."
    : startDate > endDate ? "시작일이 종료일보다 늦을 수 없습니다."
    : endDate > today ? "오늘 이후 날짜는 선택할 수 없습니다."
    : getDateRangeDates(startDate, endDate).length > MAX_REPORT_DAYS ? `기간은 최대 ${MAX_REPORT_DAYS}일까지 선택할 수 있습니다.`
    : null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!error) onSubmit(startDate, endDate);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">선택한 기간의 출석 현황을 날짜 × 이름 표로 출력합니다.</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="시작일" htmlFor="report-start">
          <TextField id="report-start" type="date" value={startDate} max={endDate || today} onChange={(e) => setStartDate(e.target.value)} />
        </FormField>
        <FormField label="종료일" htmlFor="report-end">
          <TextField id="report-end" type="date" value={endDate} min={startDate} max={today} onChange={(e) => setEndDate(e.target.value)} />
        </FormField>
      </div>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-300">
          취소
        </button>
        <button type="submit" disabled={error !== null}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
          <FileDown className="h-4 w-4" />
          PDF 출력
        </button>
      </div>
    </form>
  );
}
