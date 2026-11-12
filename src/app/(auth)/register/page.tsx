import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("register");

export default async function RegisterPage() {
  const { t } = await getI18n();
  return (
    <AuthShell
      title={t.auth.registerTitle}
      lead={t.auth.registerLead}
      footer={
        <p>
          {t.auth.haveAccount} <Link href="/login" className="underline">{t.auth.logIn}</Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
