import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Target of the links in TAAI's own email templates (see SETUP.md):
 * /auth/confirm?token_hash=...&type=email|recovery&next=/dashboard
 * Works on any device, because it does not depend on a cookie from the sign-up browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const to = request.nextUrl.clone();
  to.search = "";

  if (isSupabaseConfigured && tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      to.pathname = next;
      return NextResponse.redirect(to);
    }
  }
  to.pathname = "/login";
  to.searchParams.set("notice", "link-expired");
  return NextResponse.redirect(to);
}
