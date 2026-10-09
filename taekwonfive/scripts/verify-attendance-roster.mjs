import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const cache = new Map();
const mocks = new Map();
function load(path) {
  const filename = resolve(path);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = new Module(filename);
  loaded.paths = Module._nodeModulePaths(resolve("."));
  const original = loaded.require.bind(loaded);
  loaded.require = (name) => {
    if (mocks.has(name)) return mocks.get(name);
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    return original(name);
  };
  cache.set(filename, loaded);
  loaded._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, filename);
  return loaded.exports;
}

const { isStudentScheduled, isStudentOnLeave, formatAttendanceDays } = load("src/lib/student-schedule.ts");
const { getCalendarWeekday } = load("src/lib/date.ts");
const { getVisibleAttendanceEntries, getAttendanceRosterSummary, buildAttendanceEntries, getAutoAbsentRange, getAutoAbsentTargets } = load("src/lib/attendance-roster.ts");
const monday = "2026-09-14";
for (const timezone of ["UTC", "Asia/Seoul", "America/Los_Angeles"]) {
  process.env.TZ = timezone;
  assert.equal(getCalendarWeekday(monday), 1);
  assert.equal(getCalendarWeekday("2026-09-20"), 7);
  assert.equal(isStudentScheduled({ attendanceDays: [1, 3, 5] }, monday), true);
  assert.equal(isStudentScheduled({ attendanceDays: [1, 3, 5] }, "2026-09-15"), false);
  assert.equal(isStudentScheduled({ attendanceDays: [1, 2, 3, 4, 5] }, "2026-09-19"), false);
  assert.equal(isStudentScheduled({ attendanceDays: [1, 2, 3, 4, 5] }, "2026-09-20"), false);
  assert.equal(isStudentScheduled({ attendanceDays: null }, monday), false);
}
assert.throws(() => getCalendarWeekday("2026-02-30"));
assert.equal(isStudentOnLeave({ attendanceDays: null }), true);
assert.equal(isStudentOnLeave({ attendanceDays: [] }), true);
assert.equal(isStudentOnLeave({ attendanceDays: [1] }), false);
assert.equal(formatAttendanceDays(null), "휴관");
assert.equal(formatAttendanceDays([1, 3, 5]), "월·수·금");

const student = (id, days) => ({ id: String(id), name: `학생 ${id}`, attendanceDays: days });
const students = [student(1, [1, 5]), student(2, [1]), student(3, [3]), student(4, null),
  student(5, null), student(6, [1]), student(7, [3]), student(8, [1, 2, 3, 4, 5])];
const record = (id, status) => ({ id: `record-${id}`, studentId: String(id), date: monday, status, checkedAt: "2026-09-14T06:40:00Z", classSession: 2, note: null });
const records = [record(1, "present"), record(3, "present"), record(5, "late"), record(6, "absent"), record(7, "absent")];
const entries = buildAttendanceEntries(students, records);
const ids = (items) => items.map((entry) => entry.student.id);
assert.deepEqual(ids(getVisibleAttendanceEntries(entries, monday, "scheduled", monday)), ["1", "2", "3", "5", "6", "8"]);
assert.equal(getVisibleAttendanceEntries(entries, monday, "all", monday).length, 8);
assert.deepEqual(getAttendanceRosterSummary(entries, monday, monday), {
  historical: false, scheduledCount: 4, scheduledPresent: 1, additionalPresent: 2,
  presentCount: 3, notCheckedCount: 2, absentCount: 1, otherCount: 0, attendanceRate: 25,
});
const history = getVisibleAttendanceEntries(entries, monday, "scheduled", "2026-09-15");
assert.deepEqual(ids(history), ["1", "3", "5", "6", "7"]);
assert.deepEqual(getAttendanceRosterSummary(entries, monday, "2026-09-15"), {
  historical: true, scheduledCount: null, scheduledPresent: null, additionalPresent: null,
  presentCount: 3, notCheckedCount: null, absentCount: 2, otherCount: 0, attendanceRate: null,
});
const changedSchedules = entries.map((entry) => ({ ...entry, student: { ...entry.student, attendanceDays: null } }));
assert.deepEqual(ids(getVisibleAttendanceEntries(changedSchedules, monday, "scheduled", "2026-09-15")), ids(history));
const noRecords = buildAttendanceEntries(students, []);
assert.deepEqual(getVisibleAttendanceEntries(noRecords, "2026-09-19", "scheduled", "2026-09-19"), []);
assert.equal(getAttendanceRosterSummary(noRecords, "2026-09-19", "2026-09-19").attendanceRate, null);
assert.equal(getAttendanceRosterSummary(noRecords, monday, monday).absentCount, 0, "Unchecked students are not automatically absent");
// 기타는 출석·결석·체크 전 어디에도 들어가지 않는다.
const withOther = buildAttendanceEntries(students, [record(2, "other")]);
const otherSummary = getAttendanceRosterSummary(withOther, monday, monday);
assert.equal(otherSummary.otherCount, 1);
assert.equal(otherSummary.absentCount, 0);
assert.equal(otherSummary.presentCount, 0);
assert.equal(otherSummary.notCheckedCount, 3);

// 자동 결석: 시작일~어제, 수업 대상이면서 기록이 없고 그날 이미 등록된 학생만.
assert.equal(getAutoAbsentRange("2026-10-08"), null);
assert.deepEqual(getAutoAbsentRange("2026-10-13"), { startDate: "2026-10-08", endDate: "2026-10-12" });
assert.deepEqual(getAutoAbsentRange("2026-12-31"), { startDate: "2026-11-30", endDate: "2026-12-30" });
const autoStudents = [
  { ...student(1, [1, 2, 3, 4, 5]), createdAt: "2026-01-01T00:00:00Z" },
  { ...student(2, [4]), createdAt: "2026-01-01T00:00:00Z" },
  { ...student(3, null), createdAt: "2026-01-01T00:00:00Z" },
  { ...student(4, [1, 2, 3, 4, 5]), createdAt: "2026-10-12T01:00:00Z" },
];
const autoRecords = [{ id: "r", studentId: "1", date: "2026-10-08", status: "present", checkedAt: null, classSession: 1, note: null }];
// 10/8 목, 10/9 한글날, 10/10~11 주말, 10/12 월
assert.deepEqual(getAutoAbsentTargets(autoStudents, autoRecords, "2026-10-08", "2026-10-12"), [
  { studentId: "2", date: "2026-10-08" },
  { studentId: "1", date: "2026-10-12" },
  { studentId: "4", date: "2026-10-12" },
]);

const returned = noRecords.map((entry) => entry.student.id === "4" ? { ...entry, student: { ...entry.student, attendanceDays: [1] } } : entry);
assert.ok(ids(getVisibleAttendanceEntries(returned, monday, "scheduled", monday)).includes("4"));
const cancelledExtra = entries.map((entry) => entry.student.id === "3" ? { ...entry, status: "not_checked" } : entry);
assert.ok(!ids(getVisibleAttendanceEntries(cancelledExtra, monday, "scheduled", monday)).includes("3"));

// Verify reading numeric database IDs and saving/reloading schedule edits.
let databaseRow = { id: 4, name: "복귀 학생", attendance_days: null, created_at: "2026-09-12T00:00:00Z" };
let lastPatch;
mocks.set("@/utils/supabase/client", { createClient: () => ({ from(table) {
  assert.equal(table, "students");
  const builder = {
    select() { return builder; },
    order: async () => ({ data: [databaseRow], error: null }),
    update(patch) { lastPatch = patch; databaseRow = { ...databaseRow, ...patch }; return builder; },
    eq(key, id) { assert.equal(key, "id"); assert.equal(id, "4"); return builder; },
    maybeSingle: async () => ({ data: databaseRow, error: null }),
  };
  return builder;
} }) });
const service = load("src/services/student-service.ts");
assert.equal((await service.getStudents())[0].id, "4");
assert.equal((await service.getStudents())[0].attendanceDays, null);
await service.updateStudent("4", { attendanceDays: [5, 1, 3, 1] });
assert.deepEqual(lastPatch, { attendance_days: [1, 3, 5] });
const reloaded = (await service.getStudents())[0];
assert.deepEqual(reloaded.attendanceDays, [1, 3, 5]);
assert.equal(isStudentScheduled(reloaded, monday), true);
await service.updateStudent("4", { name: "이름 수정" });
assert.ok(!Object.hasOwn(lastPatch, "attendance_days"), "Unrelated edits must preserve weekdays");
await service.updateStudent("4", { attendanceDays: [] });
assert.equal((await service.getStudents())[0].attendanceDays, null);

const { AttendanceRow } = load("src/components/attendance/attendance-row.tsx");
const render = (entry, scheduleState) => renderToStaticMarkup(createElement(AttendanceRow, {
  entry, scheduleState, onToggle() {}, onClassSessionChange() {},
}));
// 휴관·다른 요일 학생도 카드는 막지 않고 색과 표시만 다르게 한다.
assert.ok(!render(noRecords[3], "on_leave").includes('disabled=""'), "Students on leave can still be checked");
assert.match(render(noRecords[3], "on_leave"), /휴관/);
assert.ok(!render(noRecords[2], "off_day").includes('disabled=""'), "Off-day active students can attend extra classes");
assert.ok(!render(entries[4], "on_leave").includes('disabled=""'), "Saved attendance of a student now on leave remains editable");
console.log("PASS: weekday/timezone selection, leave exclusion, extra attendance and cancellation, schedule-independent history, target-only counts, 기타 counted separately, auto-absent targets, leave/return persistence, numeric IDs, and checkable leave cards.");
