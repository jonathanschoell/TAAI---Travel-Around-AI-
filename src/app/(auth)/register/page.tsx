import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";

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
      <RegisterForm />
    </AuthShell>
  );
}
