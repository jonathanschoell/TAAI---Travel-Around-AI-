import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/env";

const PROTECTED = ["/dashboard", "/chat", "/plan", "/trips", "/profile", "/my-data", "/admin"];
const GUEST_ONLY = ["/login", "/register", "/forgot-password"];

/**
 * Refreshes the Supabase session cookie and does an optimistic redirect.
 * The real authorization check happens again in every page and server action.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();
  if (!url || !key) return response;

  const supabase = createServerClient(url.value, key.value, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  const redirectTo = (pathname: string, next?: string) => {
    const to = request.nextUrl.clone();
    to.pathname = pathname;
    to.search = "";
    if (next) to.searchParams.set("next", next);
    const res = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!signedIn && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    return redirectTo("/login", path);
  }
  if (signedIn && GUEST_ONLY.includes(path)) {
    return redirectTo("/dashboard");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
