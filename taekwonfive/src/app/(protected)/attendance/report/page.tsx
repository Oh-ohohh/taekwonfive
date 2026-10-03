import { AttendanceRangePdfView } from "@/components/attendance/attendance-range-pdf-view";
import { MAX_REPORT_DAYS } from "@/lib/attendance-roster";
import { getDateRangeDates, getKoreaDateString, isCalendarDateString } from "@/lib/date";

function parseDate(value: string | string[] | undefined, today: string): string | null {
  return typeof value === "string" && isCalendarDateString(value) && value <= today ? value : null;
}

export default async function AttendanceReportPage(props: PageProps<"/attendance/report">) {
  const searchParams = await props.searchParams;
  const today = getKoreaDateString();
  // 예전 링크(?date=)는 하루짜리 기간으로 처리한다.
  const legacyDate = parseDate(searchParams.date, today);
  let startDate = parseDate(searchParams.start, today) ?? legacyDate ?? today;
  let endDate = parseDate(searchParams.end, today) ?? legacyDate ?? today;
  if (startDate > endDate) [startDate, endDate] = [endDate, startDate];
  const dates = getDateRangeDates(startDate, endDate);
  if (dates.length > MAX_REPORT_DAYS) endDate = dates[MAX_REPORT_DAYS - 1];

  return <AttendanceRangePdfView startDate={startDate} endDate={endDate} autoPrint={searchParams.print === "1"} />;
}
