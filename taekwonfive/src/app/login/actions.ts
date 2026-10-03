"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_LOGIN_ID, DEFAULT_ADMIN_EMAIL, isAdmin, safeReturnPath } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export type AuthFormState = { error: string };

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return { error: "아이디와 비밀번호를 입력해주세요." };
  }
  if (username.trim() !== ADMIN_LOGIN_ID || password.length > 256) {
    return { error: "아이디 또는 비밀번호를 확인해주세요." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: process.env.SUPABASE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
      password,
    });
    if (error) {
      return { error: error.status === 429 ? "로그인 시도가 많습니다. 잠시 후 다시 시도해주세요." : "아이디 또는 비밀번호를 확인해주세요." };
    }
    if (!isAdmin(data.user)) {
      await supabase.auth.signOut({ scope: "local" });
      return { error: "관리자 권한이 없는 계정입니다." };
    }
  } catch {
    return { error: "로그인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/", "layout");
  redirect(safeReturnPath(formData.get("next")));
}

export async function logout(): Promise<AuthFormState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) return { error: "로그아웃하지 못했습니다. 다시 시도해주세요." };
  } catch {
    return { error: "로그아웃하지 못했습니다. 다시 시도해주세요." };
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
