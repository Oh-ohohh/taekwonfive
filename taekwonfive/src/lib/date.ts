/** Date/time formatting helpers shared across the app. */

/** Returns today's date as "YYYY-MM-DD" in the local timezone. */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** e.g. "2026년 9월 3일 목요일" */
export function formatFullDateWithWeekday(date: Date = new Date()): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/** e.g. "2026-09-03" -> "2026.09.03" */
export function formatDateDots(dateString: string): string {
  return dateString.replaceAll("-", ".");
}

/** e.g. ISO datetime -> "14:32" */
export function formatTime(isoDateTime: string | null): string {
  if (!isoDateTime) return "-";
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
