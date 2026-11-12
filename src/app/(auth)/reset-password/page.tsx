import { ResetForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/site";
import { getI18n, titleFor } from "@/lib/i18n/server";

export const generateMetadata = titleFor("reset");

export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthShell title={t.auth.resetTitle} lead={t.auth.resetLead}>
      <ResetForm />
    </AuthShell>
  );
}
