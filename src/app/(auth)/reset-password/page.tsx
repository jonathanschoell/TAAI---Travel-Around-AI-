import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      lead="You opened a valid reset link. Set a new password for your account."
    >
      <ResetForm />
    </AuthShell>
  );
}
