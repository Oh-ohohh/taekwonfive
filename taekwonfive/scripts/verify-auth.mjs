import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

const password = process.env.ADMIN_INITIAL_PASSWORD;
if (!password) throw new Error("Set ADMIN_INITIAL_PASSWORD to verify the administrator login.");
const origin = process.env.TEST_APP_URL || "http://127.0.0.1:3000";
const jar = new Map();

const filename = resolve("src/lib/auth.ts");
const helpers = new Module(filename);
helpers._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const { safeReturnPath, isAdmin } = helpers.exports;
for (const invalid of [null, "https://example.com", "//example.com", "/\\example.com", "/login", "/unknown"]) {
  assert.equal(safeReturnPath(invalid), "/");
}
assert.equal(safeReturnPath("/attendance/report?date=2026-09-11"), "/attendance/report?date=2026-09-11");
assert.equal(isAdmin({ user_metadata: { role: "admin" } }), false);
assert.equal(isAdmin({ app_metadata: { role: "admin" } }), true);

async function request(path, options = {}) {
  const response = await fetch(origin + path, {
    ...options, redirect: "manual",
    headers: { Origin: origin, Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "), ...options.headers },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index);
    const value = pair.slice(index + 1);
    if (!value || /Max-Age=0(?:;|$)/i.test(cookie)) jar.delete(name);
    else jar.set(name, value);
  }
  return response;
}

function decode(value) {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function formData(html, name) {
  const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(([form]) => form);
  const form = forms.find((candidate) => name === "login" ? candidate.includes('name="username"') : candidate.includes("로그아웃"));
  assert.ok(form, `${name} form must be rendered`);
  const data = new FormData();
  for (const [input] of form.matchAll(/<input\b[^>]*>/g)) {
    const inputName = input.match(/\bname="([^"]*)"/)?.[1];
    if (inputName) data.append(decode(inputName), decode(input.match(/\bvalue="([^"]*)"/)?.[1] || ""));
  }
  return data;
}

for (const path of ["/", "/students", "/attendance", "/attendance/report?date=2026-09-11"]) {
  const response = await request(path);
  assert.equal(response.status, 303);
  assert.ok(response.headers.get("location").startsWith("/login?next="));
}
const loginPage = await request("/login?next=%2Fstudents");
assert.equal(loginPage.status, 200);
const loginHtml = await loginPage.text();
assert.ok(!loginHtml.includes("주 메뉴"), "Login must not mount the protected shell");

const invalid = formData(loginHtml, "login");
invalid.set("username", "admin");
invalid.set("password", "invalid-test-password");
const rejected = await request("/login?next=%2Fstudents", { method: "POST", body: invalid });
assert.equal(rejected.status, 200);
assert.ok((await rejected.text()).includes("아이디 또는 비밀번호를 확인해주세요."));
assert.equal((await request("/students")).status, 303);

const valid = formData(loginHtml, "login");
valid.set("username", "admin");
valid.set("password", password);
const signedIn = await request("/login?next=%2Fstudents", { method: "POST", body: valid });
assert.equal(signedIn.status, 303);
assert.equal(signedIn.headers.get("location"), "/students");
assert.ok(jar.size > 0, "Login must issue session cookies");

try {
  for (const path of ["/", "/students", "/attendance", "/attendance/report?date=2026-09-11"]) {
    const response = await request(path);
    assert.equal(response.status, 200, `Authenticated ${path}`);
    // Next dev emits no-cache; production dynamic pages emit private/no-store.
    assert.match(response.headers.get("cache-control") || "", /no-store|no-cache/);
  }
  const repeatLogin = await request("/login?next=%2Fattendance");
  assert.equal(repeatLogin.status, 307);
  assert.equal(repeatLogin.headers.get("location"), "/attendance");

  const forged = await fetch(origin + "/students", {
    redirect: "manual", headers: { Cookie: [...jar.keys()].map((name) => `${name}=invalid-session`).join("; ") },
  });
  assert.equal(forged.status, 303, "Forged cookies must not grant access");
} finally {
  const dashboard = await request("/");
  const signout = formData(await dashboard.text(), "logout");
  const signedOut = await request("/", { method: "POST", body: signout });
  assert.equal(signedOut.status, 303);
  assert.equal(signedOut.headers.get("location"), "/login");
}
assert.equal((await request("/students")).status, 303);
console.log("PASS: protected routes, invalid password, admin login, return path, session cookies, forged-cookie rejection, logout, and post-logout access denial.");
