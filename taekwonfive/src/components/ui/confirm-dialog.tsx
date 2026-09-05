"use client";

import { Modal } from "@/components/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClassName="max-w-sm">
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-11 flex-1 rounded-xl text-sm font-semibold text-white transition-colors ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
