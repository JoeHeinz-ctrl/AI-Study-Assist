'use client';

import { UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <div className="flex justify-center">
        <UserProfile routing="hash" />
      </div>
    </div>
  );
}
