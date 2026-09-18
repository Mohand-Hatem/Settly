"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthFrame, FormAlert, PasswordField, SubmitButton } from "../_components/AuthFrame";

/**
 * Forgot / reset password (spec S1-05). Step 1 requests a link (same message whether or not the
 * email exists). Step 2 is reached from the emailed link, which returns here with ?token=…
 * A successful reset revokes every session (AUTH.md §3).
 */
function ForgotPassword() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? "This reset link is invalid or has expired. Request a new one." : null);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    setLoading(true);
    const { error: reqError } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    setLoading(false);
    if (reqError?.status === 429) return setError("Please wait a moment before trying again.");
    setSent(true);
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword: password, token: token! });
    setLoading(false);
    if (resetError) return setError("This reset link is invalid or has expired. Request a new one.");
    router.replace("/login?reset=1");
  };

  if (token && !linkError) {
    return (
      <AuthFrame title="Choose a new password" description="You'll be signed out on every device after the reset.">
        <form className="auth-form" onSubmit={reset} noValidate>
          <FormAlert message={error} />
          <PasswordField id="newPassword" label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordField id="confirmPassword" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          <SubmitButton loading={loading} label="Reset password" loadingLabel="Saving…" />
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={sent ? "Check your inbox" : "Reset your password"}
      description={
        sent
          ? "If an account exists for that email, we sent a link to reset the password. The link works once."
          : "Enter your account email and we'll send you a reset link."
      }
      footer={
        <div className="auth-register-prompt">
          <Link href="/login">Back to sign in</Link>
        </div>
      }
    >
      {!sent && (
        <form className="auth-form" onSubmit={requestLink} noValidate>
          <FormAlert message={error} />
          <div className="form-group">
            <label htmlFor="emailInput" className="form-label">Email</label>
            <div className="input-wrapper">
              <input id="emailInput" type="email" className="form-input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <SubmitButton loading={loading} label="Send reset link" loadingLabel="Sending…" />
        </form>
      )}
    </AuthFrame>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  );
}
