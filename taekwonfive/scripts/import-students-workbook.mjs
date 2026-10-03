import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

let config = {};
try { config = JSON.parse(readFileSync(".mcp.json", "utf8")); } catch { /* Environment credentials can be used. */ }
const token = process.env.SUPABASE_ACCESS_TOKEN || config.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const directory = resolve("local-data/student-import-20260912");
mkdirSync(directory, { recursive: true });

async function query(sql) {
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!response.ok) throw new Error(`Database request failed (HTTP ${response.status}).`);
  return response.json();
}

function sqlJson(value) {
  // JSON is embedded only as a quoted SQL value, never as executable input.
  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}

function prepareReset() {
  const source = JSON.parse(readFileSync(resolve(directory, "source.json"), "utf8"));
  const baseline = JSON.parse(readFileSync(resolve(directory, "inspection.json"), "utf8"));
  assert.equal(createHash("sha256").update(readFileSync(source.source)).digest("hex"), source.sha256, "Workbook changed since extraction.");
  assert.ok(Array.isArray(baseline.attendance_records), "Full attendance backup is required.");
  assert.equal(baseline.attendance_records.length, baseline.attendance_count);
  assert.equal(baseline.columns.find((column) => column.column_name === "id").data_type, "uuid");
  assert.deepEqual(baseline.referencing_constraints, [{
    name: "attendance_records_student_fk", table: "attendance_records",
    definition: "FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT",
  }]);
  assert.equal(baseline.views, null);
  assert.equal(baseline.triggers, null);
  const dayNumbers = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6, 일: 7 };
  const fields = ["name", "birth_date", "school", "gender", "grade", "poom", "guardian_name", "notes"];
  const rows = source.rows.map((row, index) => {
    const incoming = Object.fromEntries(fields.map((field) => [field, row[field] == null || row[field] === "" ? null : String(row[field]).trim()]));
    assert.ok(incoming.name, `Missing name at row ${row.source_row}.`);
    let days = null;
    const sourceDays = row["무슨 요일인지"]?.trim();
    if (sourceDays === "매일") days = [1, 2, 3, 4, 5]; // Confirmed by the user.
    else if (sourceDays) {
      days = sourceDays.split(",").map((day) => {
        const value = dayNumbers[day.trim()];
        assert.ok(value, `Unknown weekday at row ${row.source_row}.`);
        return value;
      });
      assert.equal(new Set(days).size, days.length, "Duplicate weekdays in source.");
      days.sort((a, b) => a - b);
    }
    return { id: index + 1, ...incoming, attendance_days: days };
  });
  assert.equal(new Set(rows.map((row) => row.name)).size, rows.length, "Duplicate names need review.");
  const existingIds = source.rows.map((row) => row.id).filter(Boolean);
  assert.equal(new Set(existingIds).size, existingIds.length);
  const selectFields = ["id", ...fields, "attendance_days"];
  const snapshotLiteral = sqlJson(baseline.students);
  const attendanceLiteral = sqlJson(baseline.attendance_records);
  const policyLiteral = sqlJson(baseline.policies);
  const migration = readFileSync("supabase/migrations/202609120002_student_attendance_days.sql", "utf8")
    .replace(/^begin;\s*/i, "").replace(/commit;\s*$/i, "");
  const sql = `begin;
set local lock_timeout = '10s';
set local statement_timeout = '60s';
set local standard_conforming_strings = on;
lock table public.students, public.attendance_records in access exclusive mode;
do $guard$ begin
  if (select jsonb_agg(to_jsonb(s) order by s.id) from public.students s) is distinct from ${snapshotLiteral} then
    raise exception 'Students changed since backup; refresh the backup and plan.';
  end if;
  if (select jsonb_agg(to_jsonb(a) order by a.id) from public.attendance_records a) is distinct from ${attendanceLiteral} then
    raise exception 'Attendance changed since backup; refresh the backup and plan.';
  end if;
end $guard$;

-- Reset is applied only after explicit authorization to start fresh.
delete from public.attendance_records;
delete from public.students;
alter table public.attendance_records drop constraint attendance_records_student_fk;
alter table public.students alter column id drop default;
alter table public.students alter column id type bigint using null::bigint;
alter table public.students alter column id add generated always as identity;
alter table public.attendance_records alter column student_id type bigint using null::bigint;
alter table public.attendance_records add constraint attendance_records_student_fk
  foreign key (student_id) references public.students(id) on delete restrict;
grant usage, select on sequence public.students_id_seq to authenticated, service_role;

${migration}

create temporary table import_students on commit drop as
select * from jsonb_to_recordset(${sqlJson(rows)}) as r(
  id bigint, name text, birth_date text, school text, gender text,
  grade text, poom text, guardian_name text, notes text, attendance_days smallint[]
);
insert into public.students (${selectFields.join(", ")}) overriding system value
select ${selectFields.join(", ")} from import_students order by id;
alter table public.students alter column id restart with ${rows.length + 1};

do $verify$ begin
  if (select count(*) from public.students) <> ${rows.length} then raise exception 'Student count mismatch'; end if;
  if exists (
    (select ${selectFields.join(", ")} from public.students except select ${selectFields.join(", ")} from import_students)
    union all
    (select ${selectFields.join(", ")} from import_students except select ${selectFields.join(", ")} from public.students)
  ) then raise exception 'Imported values mismatch'; end if;
  if exists (select 1 from public.attendance_records) then raise exception 'Attendance reset failed'; end if;
  if (select jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname) from pg_policies p where schemaname = 'public' and tablename in ('students', 'attendance_records')) is distinct from ${policyLiteral} then
    raise exception 'Access policies changed';
  end if;
end $verify$;
notify pgrst, 'reload schema';
commit;`;
  const plan = {
    source_sha256: source.sha256,
    source_path: source.source,
    existing_students: baseline.students.length,
    attendance_to_reset: baseline.attendance_count,
    students_to_import: rows.length,
    next_id: rows.length + 1,
    rows,
    sql,
  };
  writeFileSync(resolve(directory, "reset-plan.json"), JSON.stringify(plan, null, 2));
  console.log(JSON.stringify({ prepared: true, existing_students: plan.existing_students,
    attendance_to_reset: plan.attendance_to_reset, students_to_import: rows.length,
    next_id: plan.next_id, weekday_patterns: Object.fromEntries([...new Set(rows.map((row) => JSON.stringify(row.attendance_days)))].map((pattern) => [pattern, rows.filter((row) => JSON.stringify(row.attendance_days) === pattern).length])),
  }, null, 2));
}

async function applyReset() {
  assert.ok(process.argv.includes("--reset-attendance"), "Explicit --reset-attendance is required.");
  const plan = JSON.parse(readFileSync(resolve(directory, "reset-plan.json"), "utf8"));
  assert.equal(createHash("sha256").update(readFileSync(plan.source_path)).digest("hex"), plan.source_sha256, "Workbook changed since preparation.");
  // Rehearse the exact changes and validations in a transaction that rolls back.
  await query(plan.sql.replace(/commit;\s*$/i, "rollback;"));
  console.log("Database rehearsal passed; all rehearsal changes rolled back.");
  await query(plan.sql);
  console.log("Committed student import, numeric IDs, weekdays, and attendance reset.");
  const [result] = await query(`select
    (select jsonb_agg(to_jsonb(s) order by s.id) from public.students s) as students,
    (select count(*) from public.attendance_records) as attendance_count,
    (select jsonb_agg(to_jsonb(c)) from information_schema.columns c where table_schema = 'public' and table_name in ('students','attendance_records') and column_name in ('id','student_id','attendance_days')) as columns,
    (select last_value from public.students_id_seq) as next_id,
    (select is_called from public.students_id_seq) as sequence_called`);
  const observed = result.students.map((student) => Object.fromEntries(Object.keys(plan.rows[0]).map((key) => [key, student[key]])));
  assert.deepEqual(observed, plan.rows);
  assert.equal(result.attendance_count, 0);
  assert.equal(result.next_id, plan.next_id);
  assert.equal(result.sequence_called, false);
  writeFileSync(resolve(directory, "after.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ verified_students: observed.length, attendance_count: result.attendance_count, next_id: result.next_id, columns: result.columns.map(({ table_name, column_name, data_type, is_identity }) => ({ table_name, column_name, data_type, is_identity })) }, null, 2));
}

try {
  const command = process.argv[2];
  if (command === "prepare-reset") {
    prepareReset();
    process.exit(0);
  }
  if (command === "apply-reset") {
    await applyReset();
    process.exit(0);
  }
  if (command !== "inspect") throw new Error("Supported commands: inspect, prepare-reset, apply-reset");
  const [snapshot] = await query(`select
    (select jsonb_agg(to_jsonb(s) order by s.id) from public.students s) as students,
    (select jsonb_agg(to_jsonb(a) order by a.id) from public.attendance_records a) as attendance_records,
    (select count(*) from public.attendance_records) as attendance_count,
    (select md5(coalesce(string_agg(to_jsonb(a)::text, '' order by a.id), '')) from public.attendance_records a) as attendance_hash,
    (select jsonb_agg(to_jsonb(c)) from information_schema.columns c where table_schema = 'public' and table_name = 'students') as columns,
    (select jsonb_agg(jsonb_build_object('name', conname, 'definition', pg_get_constraintdef(oid))) from pg_constraint where conrelid = 'public.students'::regclass) as constraints,
    (select jsonb_agg(jsonb_build_object('table', conrelid::regclass::text, 'name', conname, 'definition', pg_get_constraintdef(oid))) from pg_constraint where confrelid = 'public.students'::regclass) as referencing_constraints,
    (select jsonb_agg(jsonb_build_object('name', viewname, 'definition', definition)) from pg_views where schemaname = 'public' and definition ilike '%students%') as views,
    (select jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname) from pg_policies p where schemaname = 'public' and tablename in ('students', 'attendance_records')) as policies,
    (select jsonb_agg(jsonb_build_object('name', tgname, 'definition', pg_get_triggerdef(oid))) from pg_trigger where tgrelid = 'public.students'::regclass and not tgisinternal) as triggers`);
  const stamp = new Date().toISOString().replaceAll(":", "-");
  writeFileSync(resolve(directory, `before-${stamp}.json`), JSON.stringify(snapshot, null, 2), { flag: "wx" });
  writeFileSync(resolve(directory, "inspection.json"), JSON.stringify(snapshot, null, 2));
  const source = JSON.parse(readFileSync(resolve(directory, "source.json"), "utf8"));
  const byId = new Map(snapshot.students.map((student) => [student.id, student]));
  const sourceIds = new Set(source.rows.map((row) => row.id));
  const normalize = (value) => value === null || value === undefined || value === "-" || value === "" ? null : String(value).trim();
  const fields = ["name", "birth_date", "school", "gender", "grade", "poom", "guardian_name", "notes"];
  const changes = [];
  for (const row of source.rows) {
    const current = byId.get(row.id);
    if (!current) continue;
    const modified = fields.filter((field) => normalize(row[field]) !== normalize(current[field]));
    if (modified.length) changes.push({ row: row.source_row, fields: Object.fromEntries(modified.map((field) => [field, { before: current[field], after: row[field] }])) });
  }
  console.log(JSON.stringify({
    source_count: source.rows.length,
    database_count: snapshot.students.length,
    attendance_count: snapshot.attendance_count,
    columns: snapshot.columns.map(({ column_name, data_type, udt_name, is_nullable, column_default }) => ({ column_name, data_type, udt_name, is_nullable, column_default })),
    constraints: snapshot.constraints,
    referencing_constraints: snapshot.referencing_constraints,
    views: snapshot.views,
    triggers: snapshot.triggers,
    matched: source.rows.filter((row) => byId.has(row.id)).length,
    unmatched_source: source.rows.filter((row) => !byId.has(row.id)).map(({ source_row, name, id }) => ({ row: source_row, name, id })),
    database_only_count: snapshot.students.filter((row) => !sourceIds.has(row.id)).length,
    changed_rows: changes.length,
    name_changes: changes.filter((change) => change.fields.name).length,
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
