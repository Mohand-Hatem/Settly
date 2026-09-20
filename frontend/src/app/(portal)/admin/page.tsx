import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Settly" };

/** Admin landing (#100, #106). Admin tools (moderation, verification, audit log) arrive in a later phase. */
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-navy-900">Admin</h1>
      <p className="mt-2 text-sm text-ink-2">
        Admin tools such as listing moderation, agent verification and the audit log are part of a later
        phase and are not available yet. You can use the buyer portal with the same account.
      </p>
    </div>
  );
}
