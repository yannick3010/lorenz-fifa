export const dynamic = "force-dynamic";

import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <ProfileForm />
    </div>
  );
}
