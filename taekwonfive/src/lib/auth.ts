export const ADMIN_LOGIN_ID = "admin";
export const DEFAULT_ADMIN_EMAIL = "admin@taekwonfive.internal";

export function isAdmin(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.role === "admin";
}

/** Only return to known application pages, never a user-supplied host. */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  const origin = "https://taekwonfive.invalid";
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !["/", "/attendance", "/attendance/report", "/students"].includes(url.pathname)) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}
