import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const cache = new Map();
const mocks = new Map();
function load(relativePath) {
  const filename = resolve(relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = new Module(filename);
  loaded.paths = Module._nodeModulePaths(resolve("."));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (name) => {
    if (mocks.has(name)) return mocks.get(name);
    if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
    return originalRequire(name);
  };
  cache.set(filename, loaded);
  loaded._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, filename);
  return loaded.exports;
}

const { getAutomaticClassSession } = load("src/lib/class-session.ts");
const date = "2026-09-12";
const cases = [
  ["00:00:00", null], ["13:49:59", null], ["13:50:00", 1], ["14:00:00", 1], ["14:50:59", 1], ["14:51:00", null],
  ["15:19:59", null], ["15:20:00", 2], ["16:20:59", 2], ["16:21:00", null],
  ["16:49:59", null], ["16:50:00", 3], ["17:50:59", 3], ["17:51:00", null],
  ["18:19:59", null], ["18:20:00", 4], ["19:19:59", 4], ["19:20:00", 5],
  ["20:19:59", 5], ["20:20:00", 6], ["22:00:59", 6], ["22:01:00", null], ["23:59:59", null],
];
for (const timezone of ["UTC", "Asia/Seoul", "America/Los_Angeles"]) {
  process.env.TZ = timezone;
  for (const [time, expected] of cases) {
    assert.equal(getAutomaticClassSession(date, new Date(`${date}T${time}+09:00`)), expected, `${timezone}: ${time}`);
  }
  assert.equal(getAutomaticClassSession("2026-09-11", new Date(`${date}T15:40:00+09:00`)), null);
}

// Exercise actual service methods with a database double, including refresh,
// isolated manual edits, failure, and clearing/recreating attendance.
let row = null;
let failNext = false;
let lastPatch;
const client = {
  from(table) {
    assert.equal(table, "attendance_records");
    let operation = "read";
    let patch;
    const filters = [];
    let statuses;
    const run = () => {
      if (failNext) { failNext = false; return { data: null, error: new Error("Save failed") }; }
      if (operation === "upsert") row = { id: "record-1", note: "keep this note", ...patch };
      else if (operation === "update") {
        assert.deepEqual(filters, [["student_id", "student-1"], ["attendance_date", date]]);
        assert.deepEqual(statuses, ["present", "late"]);
        if (!row) return { data: null, error: new Error("Missing record") };
        row = { ...row, ...patch };
      } else if (operation === "delete") row = null;
      return { data: row, error: null };
    };
    const builder = {
      upsert(value) { operation = "upsert"; patch = value; return builder; },
      update(value) { operation = "update"; patch = value; lastPatch = value; return builder; },
      delete() { operation = "delete"; return builder; },
      eq(...filter) { filters.push(filter); return builder; },
      in(column, values) { assert.equal(column, "status"); statuses = values; return builder; },
      select() { return builder; },
      single: async () => run(),
      then(fulfilled, rejected) {
        const result = run();
        if (operation === "read") result.data = row ? [row] : [];
        return Promise.resolve(result).then(fulfilled, rejected);
      },
    };
    return builder;
  },
};
mocks.set("@/utils/supabase/client", { createClient: () => client });
const service = load("src/services/attendance-service.ts");
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [`${date}T15:40:00+09:00`])); }
};
try {
  const first = await service.upsertAttendance("student-1", date, "present");
  assert.equal(first.classSession, 2);
  const edited = await service.updateAttendanceClassSession("student-1", date, 5);
  assert.deepEqual(lastPatch, { class_session: 5 });
  assert.equal(edited.checkedAt, first.checkedAt);
  assert.equal(edited.note, first.note);
  assert.equal(edited.status, "present");
  assert.equal((await service.getAttendanceByDate(date))[0].classSession, 5);
  failNext = true;
  await assert.rejects(service.updateAttendanceClassSession("student-1", date, 6));
  assert.equal((await service.getAttendanceByDate(date))[0].classSession, 5);
  assert.equal((await service.updateAttendanceClassSession("student-1", date, null)).classSession, null);
  await service.resetAttendance("student-1", date);
  assert.deepEqual(await service.getAttendanceByDate(date), []);
  await assert.rejects(service.updateAttendanceClassSession("student-1", date, 1));
  assert.equal((await service.upsertAttendance("student-1", date, "late")).classSession, 2);
  assert.equal((await service.upsertAttendance("student-1", "2026-09-11", "present")).classSession, null);
  const absent = await service.upsertAttendance("student-1", date, "absent");
  assert.equal(absent.classSession, null);
  assert.equal(absent.checkedAt, null);
  const other = await service.upsertAttendance("student-1", date, "other", { note: " 상담 " });
  assert.equal(row.status, "absent", "기타 is stored within the existing status constraint");
  assert.equal(other.status, "other");
  assert.equal(other.note, "상담");
  assert.equal((await service.upsertAttendance("student-1", date, "other")).note, null);
  assert.equal((await service.upsertAttendance("student-1", date, "absent", { note: "감기" })).note, "감기");
  const backToPresent = await service.upsertAttendance("student-1", date, "present", { classSession: 4 });
  assert.equal(backToPresent.classSession, 4);
  assert.equal(backToPresent.note, null);
} finally { globalThis.Date = RealDate; }

const { AttendanceRow } = load("src/components/attendance/attendance-row.tsx");
const entry = { student: { id: "student-1", name: "테스트 학생" }, status: "present", checkedAt: null, classSession: 2 };
const render = (overrides) => renderToStaticMarkup(createElement(AttendanceRow, {
  entry: { ...entry, ...overrides }, onToggle() {}, onClassSessionChange() {},
}));
const html = render({});
assert.match(html, /value="2" selected="">2부/);
assert.ok(html.indexOf("</button>") < html.indexOf("<select"), "Selector must be outside attendance button");
assert.equal((html.match(/<option /g) || []).length, 9);
assert.ok(html.indexOf(">6부<") < html.indexOf(">결석<") && html.indexOf(">결석<") < html.indexOf(">기타<"), "결석·기타 follow 6부");
assert.match(render({ status: "absent", classSession: null }), /value="absent" selected="">결석/);
assert.match(render({ status: "other", classSession: null }), /value="other" selected="">기타/);
assert.ok(!render({ status: "absent", classSession: null }).includes(">부 선택<"));
assert.match(render({ classSession: null }), /value="" selected="">부 선택/);
assert.ok(!render({ status: "not_checked", classSession: null }).includes("<select"));
assert.equal((render({ pending: true }).match(/disabled=""/g) || []).length, 2);
console.log("PASS: 69 timezone/boundary cases, historical dates, auto-save, manual edit timestamp preservation, refresh, save failure, reset/recheck, and independent accessible session selector.");
