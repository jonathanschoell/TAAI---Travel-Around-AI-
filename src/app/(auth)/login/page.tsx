import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("login");

export default async function LoginPage() {
  const { t } = await getI18n();
  return (
    <AuthShell
      title={t.auth.loginTitle}
      lead={t.auth.loginLead}
      footer={
        <p>
          {t.auth.newHere} <Link href="/register" className="underline">{t.auth.createAnAccount}</Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-muted">{t.site.loading}</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
