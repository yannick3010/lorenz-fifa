export const dynamic = "force-dynamic";

import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--fifa-muted)]">
          Account
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white">Profile</h1>
      </div>
      <ProfileForm />
    </div>
  );
}
