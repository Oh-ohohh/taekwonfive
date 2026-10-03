import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Run from the project root with: node --env-file=.env.local scripts/manage-admin.mjs inspect
let config = {};
try { config = JSON.parse(readFileSync(".mcp.json", "utf8")); } catch { /* Environment credentials can be used instead. */ }
const token = process.env.SUPABASE_ACCESS_TOKEN || config.mcpServers?.supabase?.env?.SUPABASE_ACCESS_TOKEN;
const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const email = process.env.SUPABASE_ADMIN_EMAIL || "admin@taekwonfive.internal";
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

async function management(path, options = {}) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Supabase management request failed (HTTP ${response.status}).`);
  return response.json();
}

try {
  const command = process.argv[2];
  if (!["inspect", "provision", "verify"].includes(command)) throw new Error("Supported commands: inspect, provision, verify");
  const settings = await management("/config/auth");
  console.log(JSON.stringify({
    minimumPasswordLength: settings.password_min_length,
    passwordRequirements: settings.password_required_characters,
    emailEnabled: settings.external_email_enabled,
    signupDisabled: settings.disable_signup,
    confirmEmail: !settings.mailer_autoconfirm,
  }));
  const policies = await management("/database/query", {
    method: "POST",
    body: JSON.stringify({ query: "select tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname = 'public' and tablename in ('students', 'attendance_records');" }),
  });
  console.log(JSON.stringify({ policies }));

  if (command !== "inspect") {
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (!password || password.length < settings.password_min_length) throw new Error("Set ADMIN_INITIAL_PASSWORD to a password meeting the project requirements.");
    const keys = await management("/api-keys");
    const serviceKey = keys.find((key) => key.name === "service_role")?.api_key;
    if (!serviceKey) throw new Error("No server-side service key was available.");
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, clientOptions);

    if (command === "provision") {
      let existing;
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
        if (error) throw error;
        existing = data.users.find((user) => user.email === email);
        if (existing || data.users.length < 100) break;
      }
      if (existing && existing.app_metadata?.role !== "admin") throw new Error("The configured email already belongs to a non-admin account; no changes made.");
      if (!existing) {
        const { error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true,
          app_metadata: { role: "admin" },
          user_metadata: { username: "admin", name: "도장 관리자" },
        });
        if (error) throw error;
        console.log("Administrator created and email confirmed.");
      } else {
        console.log("Existing administrator found; password left unchanged.");
      }
    }

    const signedIn = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, clientOptions);
    const { data: auth, error: authError } = await signedIn.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    try {
      if (auth.user.app_metadata.role !== "admin") throw new Error("Admin role check failed.");
      if (command === "provision") {
        const installed = policies.filter((policy) => ["taekwonfive_admin_required", "taekwonfive_admin_access"].includes(policy.policyname));
        if (installed.length === 0) {
          await management("/database/query", { method: "POST", body: JSON.stringify({ query: readFileSync("supabase/migrations/202609110001_admin_access.sql", "utf8") }) });
          console.log("Administrator-only RLS policies applied to students and attendance_records.");
        } else if (installed.length !== 4) {
          throw new Error("Partial admin policies found; inspect before changing them.");
        }
      }

      const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, clientOptions);
      for (const table of ["students", "attendance_records"]) {
        const [anonResult, adminResult, totalResult] = await Promise.all([
          anonymous.from(table).select("id", { count: "exact", head: true }),
          signedIn.from(table).select("id", { count: "exact", head: true }),
          admin.from(table).select("id", { count: "exact", head: true }),
        ]);
        if (!anonResult.error && anonResult.count !== 0) throw new Error(`Anonymous access is still possible for ${table}.`);
        if (adminResult.error || totalResult.error || adminResult.count !== totalResult.count) throw new Error(`Admin read verification failed for ${table}.`);
        console.log(`${table}: anonymous access blocked; administrator can read all rows.`);
      }
      // Read-only transaction: a regular authenticated user cannot promote
      // themselves by putting an admin role in their editable user_metadata.
      const claims = JSON.stringify({ sub: "00000000-0000-4000-8000-000000000001", role: "authenticated", app_metadata: {}, user_metadata: { role: "admin" } });
      const regularUserCheck = await management("/database/query", {
        method: "POST",
        body: JSON.stringify({ query: `begin; select set_config('request.jwt.claims', '${claims}', true); set local role authenticated; select (select count(*) from public.students) = 0 as students_blocked, (select count(*) from public.attendance_records) = 0 as attendance_blocked; rollback;` }),
      });
      if (!regularUserCheck.some((row) => row.students_blocked === true && row.attendance_blocked === true)) throw new Error("Non-admin RLS check failed.");
      console.log("Regular authenticated users with spoofed user_metadata cannot read either table.");
      console.log("Administrator password login and role verification passed.");
    } finally {
      await signedIn.auth.signOut({ scope: "local" });
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
