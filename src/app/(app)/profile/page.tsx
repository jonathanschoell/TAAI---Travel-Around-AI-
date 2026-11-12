import type { Metadata } from "next";
import { ProfileForm } from "@/components/app-forms";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Profile</h1>
        <p className="mt-2 text-muted">
          Signed in as {user.email}. Only the profile name is required.
        </p>
      </div>
      <div className="card">
        {profile ? (
          <ProfileForm profile={profile} />
        ) : (
          <p className="notice notice-error">
            Your profile could not be loaded. The database tables may not be set up yet.
          </p>
        )}
      </div>
      <aside className="card">
        <h2 className="text-lg font-bold">Why Jovia asks</h2>
        <p className="mt-2 text-sm text-muted">
          Currency, home town and canton pre-fill the trip planner. The age group helps
          suggest activities that fit. You can change or clear these at any time.
        </p>
      </aside>
    </div>
  );
}
