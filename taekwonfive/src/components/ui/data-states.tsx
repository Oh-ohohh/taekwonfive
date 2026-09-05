import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "불러오는 중입니다..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function EmptyState({
  title = "표시할 데이터가 없습니다",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <Inbox className="h-6 w-6 text-slate-300" />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  message = "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-6 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-red-500" />
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
