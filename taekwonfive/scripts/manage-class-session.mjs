import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Uses the same project and management credential as manage-admin.mjs.
// No credentials or student data are printed.
let config = {};
try { config = JSON.parse(readFileSync(".mcp.json", "utf8")); } catch { /* Use environment credentials. */ }
const token = process.env.SUPABASE_ACCESS_TOKEN || config.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

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

try {
  const command = process.argv[2];
  if (!["inspect", "apply"].includes(command)) throw new Error("Use inspect or apply.");
  const inspectSql = "select data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'attendance_records' and column_name = 'class_session'";
  let columns = await query(inspectSql);
  if (!columns.length && command === "apply") {
    await query(readFileSync("supabase/migrations/202609120001_attendance_class_session.sql", "utf8"));
    columns = await query(inspectSql);
    console.log("Applied attendance class session migration.");
  }
  if (!columns.length) {
    console.log("Class session migration is not yet applied.");
  } else {
    assert.equal(columns[0].data_type, "smallint");
    assert.equal(columns[0].is_nullable, "YES");
    const constraints = await query("select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid = 'public.attendance_records'::regclass and conname = 'attendance_records_class_session_check'");
    assert.equal(constraints.length, 1);
    assert.match(constraints[0].definition, /class_session >= 1/);
    assert.match(constraints[0].definition, /class_session <= 6/);
    console.log("Verified nullable class_session column and 1-6 constraint.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
