import type { Metadata } from "next";
import { ProfileForm } from "@/components/app-forms";
import { getProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
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
    </div>
  );
}
