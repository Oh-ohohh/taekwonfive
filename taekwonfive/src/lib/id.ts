/**
 * Generates a unique id for mock records created at runtime.
 * When Supabase is connected, the database will generate ids instead and
 * this helper will no longer be needed inside the service layer.
 */
export function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
