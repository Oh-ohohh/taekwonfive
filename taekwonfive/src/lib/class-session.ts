import { getKoreaDateString, KOREA_TIME_ZONE } from "@/lib/date";
import type { ClassSession } from "@/types/attendance";

export const CLASS_SESSIONS: { value: ClassSession; time: string; start: number; end: number }[] = [
  { value: 1, time: "14:00~14:50", start: 13 * 60 + 50, end: 14 * 60 + 50 },
  { value: 2, time: "15:30~16:20", start: 15 * 60 + 20, end: 16 * 60 + 20 },
  { value: 3, time: "17:00~17:50", start: 16 * 60 + 50, end: 17 * 60 + 50 },
  { value: 4, time: "18:30~19:20", start: 18 * 60 + 20, end: 19 * 60 + 20 },
  { value: 5, time: "19:30~20:20", start: 19 * 60 + 20, end: 20 * 60 + 20 },
  { value: 6, time: "20:30~22:00", start: 20 * 60 + 20, end: 22 * 60 },
];

/** Historical entries require manual selection. End minutes are inclusive;
 * at a shared boundary the later session takes precedence. */
export function getAutomaticClassSession(date: string, checkedAt: Date = new Date()): ClassSession | null {
  if (date !== getKoreaDateString(checkedAt)) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KOREA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(checkedAt);
  const minutes = Number(parts.find((part) => part.type === "hour")?.value) * 60
    + Number(parts.find((part) => part.type === "minute")?.value);

  for (let index = CLASS_SESSIONS.length - 1; index >= 0; index--) {
    const session = CLASS_SESSIONS[index];
    if (minutes >= session.start && minutes <= session.end) return session.value;
  }
  return null;
}
