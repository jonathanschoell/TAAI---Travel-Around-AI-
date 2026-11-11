import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell, SetupNotice } from "@/components/site";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      lead="Log in to plan trips and see your saved itineraries."
      footer={
        <p>
          New to TAAI? <Link href="/register" className="underline">Create an account</Link>
        </p>
      }
    >
      {isSupabaseConfigured ? null : <div className="mb-4"><SetupNotice /></div>}
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
