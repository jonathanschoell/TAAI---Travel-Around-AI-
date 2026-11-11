import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell, SetupNotice } from "@/components/site";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      lead="An account keeps your trips and travel preferences in one private place."
      footer={
        <p>
          Already have an account? <Link href="/login" className="underline">Log in</Link>
        </p>
      }
    >
      {isSupabaseConfigured ? null : <div className="mb-4"><SetupNotice /></div>}
      <RegisterForm />
    </AuthShell>
  );
}
