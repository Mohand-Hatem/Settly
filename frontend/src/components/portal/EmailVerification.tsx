"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

/**
 * The verification boundary made visible (#38, UX_PATTERNS §3, spec S1-07): guarded actions stay
 * visible; for an unverified user they open this dialog instead of failing silently.
 */
type Gate = {
  isVerified: boolean;
  /** Runs `action` when verified; otherwise opens the verification dialog. */
  guard: (action: () => void) => void;
  openDialog: () => void;
};

const VerificationContext = createContext<Gate | null>(null);

export function useVerificationGate(): Gate {
  const ctx = useContext(VerificationContext);
  if (!ctx) throw new Error("useVerificationGate must be used inside <VerificationProvider>");
  return ctx;
}

async function resend(email: string) {
  const { error } = await authClient.sendVerificationEmail({
    email,
    callbackURL: `${window.location.origin}/verify-email?status=verified`,
  });
  if (error) toast.error("We couldn't send the email. Please try again in a moment.");
  else toast.success(`Verification email sent to ${email}.`);
}

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const user = session?.user;
  const isVerified = Boolean(user?.emailVerified);

  const guard = useCallback(
    (action: () => void) => {
      if (!user || isVerified) action();
      else setOpen(true);
    },
    [user, isVerified]
  );

  return (
    <VerificationContext.Provider value={{ isVerified, guard, openDialog: () => setOpen(true) }}>
      {children}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Verify your email first"
        description="You need a verified email address to request viewings and make offers."
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">
            We sent a verification link to <strong className="text-ink">{user?.email}</strong>. Open it on
            this device, then come back here.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              variant="navy"
              isLoading={sending}
              onClick={async () => {
                if (!user?.email) return;
                setSending(true);
                await resend(user.email);
                setSending(false);
              }}
            >
              Resend email
            </Button>
          </div>
        </div>
      </Modal>
    </VerificationContext.Provider>
  );
}

/** Persistent banner in the portal shells while the email is unverified. */
export function VerificationBanner() {
  const { data: session } = authClient.useSession();
  const [sending, setSending] = useState(false);
  const user = session?.user;
  if (!user || user.emailVerified) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 border-b border-brass/30 bg-brass-50 px-4 py-2.5 text-sm text-ink sm:px-6"
    >
      <MailCheck className="h-4 w-4 shrink-0 text-brass-600" aria-hidden />
      <span className="flex-1 min-w-[12rem]">
        Verify your email to request viewings and make offers.
      </span>
      <button
        type="button"
        disabled={sending}
        onClick={async () => {
          setSending(true);
          await resend(user.email);
          setSending(false);
        }}
        className="font-semibold text-navy-900 underline underline-offset-2 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Resend email"}
      </button>
    </div>
  );
}
