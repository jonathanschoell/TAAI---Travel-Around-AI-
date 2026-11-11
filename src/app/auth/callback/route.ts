import { type NextRequest, NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Target of Supabase's default email links (?code=...).
 * The code can only be exchanged in the browser that started the flow. If the link is
 * opened elsewhere, the email is still confirmed, so we send the person to log in.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const to = request.nextUrl.clone();
  to.search = "";

  if (isSupabaseConfigured() && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      to.pathname = next;
      return NextResponse.redirect(to);
    }
  }
  to.pathname = "/login";
  to.searchParams.set("notice", next === "/reset-password" ? "link-expired" : "confirmed");
  return NextResponse.redirect(to);
}
