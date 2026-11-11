import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      lead="Enter your email and we will send you a link to choose a new one."
      footer={
        <p>
          Remembered it? <Link href="/login" className="underline">Back to log in</Link>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
