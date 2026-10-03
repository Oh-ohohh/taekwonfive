import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isAdmin, safeReturnPath } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the auth token if needed. Do not run any code between
  // createServerClient and getClaims/getUser — doing so can cause hard-to
  // debug issues with users being randomly logged out.
  const { data, error } = await supabase.auth.getClaims();
  const admin = !error && isAdmin(data?.claims);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!admin && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", safeReturnPath(request.nextUrl.pathname + request.nextUrl.search));
    const response = NextResponse.redirect(url, 303);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  // Authenticated HTML and token refresh responses must never enter a shared cache.
  supabaseResponse.headers.set("Cache-Control", "private, no-store");

  return supabaseResponse;
};
