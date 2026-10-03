/** Date/time formatting helpers shared across the app.
 *
 * The studio operates in Korea, so every date boundary (attendance date,
 * "today", displayed times) must be computed against Asia/Seoul rather than
 * the browser's or server's local timezone. Never derive a date via
 * `new Date().toISOString().split("T")[0]` — that reads the UTC day, which
 * is behind the Korean day for a good chunk of the Korean morning.
 */

export const KOREA_TIME_ZONE = "Asia/Seoul";

type MonthParts = {
  year: number;
  month: number;
};

function parseMonth(monthString: string): MonthParts {
  const match = /^(\d{4})-(\d{2})$/.exec(monthString);
  if (!match) throw new RangeError(`Invalid month: ${monthString}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new RangeError(`Invalid month: ${monthString}`);

  return { year, month };
}

function parseCalendarDate(dateString: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) throw new RangeError(`Invalid date: ${dateString}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    month < 1 ||
    month > 12 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid date: ${dateString}`);
  }

  return date;
}

/** Returns the given instant's calendar date in Asia/Seoul as "YYYY-MM-DD".
 * Defaults to the current instant, i.e. "today" in Korea. */
export function getKoreaDateString(date: Date = new Date()): string {
  // en-CA locale formats as YYYY-MM-DD, which is exactly the shape a
  // Postgres `date` column and an <input type="date"> both expect.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** ISO weekday of a Korea-calendar date: Monday=1 through Sunday=7. */
export function getCalendarWeekday(dateString: string): number {
  return parseCalendarDate(dateString).getUTCDay() || 7;
}

/** Returns the Korea-calendar month for a date, e.g. "2026-09". */
export function getKoreaMonthString(date: Date = new Date()): string {
  return getKoreaDateString(date).slice(0, 7);
}

/** Moves a "YYYY-MM" month by the given number of months. */
export function shiftMonth(monthString: string, offset: number): string {
  const { year, month } = parseMonth(monthString);
  const next = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First and last Korea-calendar dates included in a "YYYY-MM" month. */
export function getMonthDateRange(monthString: string): { startDate: string; endDate: string } {
  const { year, month } = parseMonth(monthString);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    startDate: `${monthString}-01`,
    endDate: `${monthString}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Calendar placement and date strings for a Korea-calendar month. Sunday is index 0. */
export function getMonthCalendarDates(monthString: string): {
  leadingEmptyDays: number;
  dates: string[];
} {
  const { year, month } = parseMonth(monthString);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Korean noon is safely within the intended weekday even when this runs in
  // a server/browser configured for another timezone. getUTCDay reads that
  // same Korea-calendar day from its UTC representation.
  const leadingEmptyDays = new Date(`${monthString}-01T12:00:00+09:00`).getUTCDay();

  return {
    leadingEmptyDays,
    dates: Array.from(
      { length: lastDay },
      (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
    ),
  };
}

/** Whether a value is a real Korea-calendar date in the form "YYYY-MM-DD". */
export function isCalendarDateString(value: string): boolean {
  try {
    parseCalendarDate(value);
    return true;
  } catch {
    return false;
  }
}

/** Inclusive Korea-calendar date strings in ascending order. */
export function getDateRangeDates(startDate: string, endDate: string): string[] {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);
  if (start > end) throw new RangeError("The start date must be before the end date.");

  const dates: string[] = [];
  for (const current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}-${String(current.getUTCDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

/** e.g. "2026-09" -> "2026년 9월". */
export function formatMonthLabel(monthString: string): string {
  const date = new Date(`${monthString}-01T12:00:00+09:00`);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: KOREA_TIME_ZONE,
  });
}

/** e.g. "2026-09-03" -> "2026년 9월 3일 목요일". Defaults to today in Korea. */
export function formatFullDateWithWeekday(dateString: string = getKoreaDateString()): string {
  // Anchored at Korean noon so the weekday/date can't shift across a UTC
  // day boundary when the runtime's local timezone differs from Korea.
  const date = new Date(`${dateString}T12:00:00+09:00`);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: KOREA_TIME_ZONE,
  });
}

/** e.g. "2026-09-03" -> "2026.09.03" */
export function formatDateDots(dateString: string): string {
  return dateString.replaceAll("-", ".");
}

/** e.g. ISO datetime -> "2026.09.03" (Korea calendar date) */
export function formatDateTimeDots(isoDateTime: string | null): string {
  if (!isoDateTime) return "-";
  return formatDateDots(getKoreaDateString(new Date(isoDateTime)));
}

/** e.g. ISO datetime -> "14:32" (Korea local time) */
export function formatTime(isoDateTime: string | null): string {
  if (!isoDateTime) return "-";
  const date = new Date(isoDateTime);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: KOREA_TIME_ZONE,
  });
}
