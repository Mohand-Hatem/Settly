"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient, ROLE_HOME, roleOf, safeCallbackUrl } from "@/lib/auth-client";
import { AuthFrame, FormAlert } from "../_components/AuthFrame";

/**
 * Verify email (spec S1-04). Better Auth email link only (#9, #106) — there is no code to type.
 * Better Auth redirects back here with ?status=verified on success or ?error=… on failure.
 */
function VerifyEmail() {
  const params = useSearchParams();
  const { data: session, isPending, refetch } = authClient.useSession();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const linkError = params.get("error");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email && !email) setEmail(session.user.email);
  }, [session?.user?.email, email]);

  useEffect(() => {
    if (params.get("status") === "verified") void refetch();
  }, [params, refetch]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verified = Boolean(session?.user?.emailVerified) || (params.get("status") === "verified" && !linkError);
  const continueHref = callbackUrl ?? (session?.user ? ROLE_HOME[roleOf(session.user)] : "/login");

  const resend = async () => {
    setError(null);
    setMessage(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email address you registered with.");
    const { error: sendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/verify-email?status=verified${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
    });
    if (sendError) {
      setError(sendError.status === 429 ? "Please wait a moment before requesting another email." : "We couldn't send the email. Please try again.");
      return;
    }
    setMessage(`We sent a new link to ${email}.`);
    setCooldown(60);
  };

  if (isPending && !linkError) {
    return <AuthFrame title="Checking your account…"><p className="auth-card-desc">One moment.</p></AuthFrame>;
  }

  if (verified) {
    return (
      <AuthFrame title="Email verified" description="You can now request viewings and make offers.">
        <Link href={continueHref} className="btn-auth-submit" style={{ display: "flex", justifyContent: "center" }}>
          Continue
        </Link>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title={linkError ? "This link has expired or was already used" : "Check your inbox"}
      description={
        linkError
          ? "Verification links work once and expire. Request a new one below."
          : "We sent you a verification link. Open it to activate viewings and offers. You can keep browsing in the meantime."
      }
      footer={
        <div className="auth-register-prompt">
          <Link href={session?.user ? ROLE_HOME[roleOf(session.user)] : "/"}>Continue browsing</Link>
        </div>
      }
    >
      <div className="auth-form">
        <FormAlert message={error} />
        {message && <p role="status" className="auth-card-desc" style={{ marginBottom: 12 }}>{message}</p>}
        {!session?.user && (
          <div className="form-group">
            <label htmlFor="emailInput" className="form-label">Email</label>
            <div className="input-wrapper">
              <input id="emailInput" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>
        )}
        {session?.user && (
          <p className="auth-card-desc" style={{ marginBottom: 12 }}>
            Sent to <strong>{session.user.email}</strong>
          </p>
        )}
        <button type="button" className="btn-auth-submit" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
        </button>
      </div>
    </AuthFrame>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
