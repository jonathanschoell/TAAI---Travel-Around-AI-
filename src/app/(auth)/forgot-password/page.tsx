import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("forgot");

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthShell
      title={t.auth.forgotTitle}
      lead={t.auth.forgotLead}
      footer={
        <p>
          {t.auth.remembered} <Link href="/login" className="underline">{t.auth.backToLogin}</Link>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
