"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, ROLE_HOME, roleOf, safeCallbackUrl } from "@/lib/auth-client";
import { AuthFrame, FormAlert, GoogleButton, PasswordField, SubmitButton } from "../_components/AuthFrame";

/**
 * Login (spec S1-03). One login for every role; the role comes from the account (#97).
 * Redirect: a safe same-site callbackUrl, else the role's dashboard (/buyer, /agent, /admin).
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const banned = params.get("error") === "banned";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(banned ? "Your account is suspended." : null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: signInError } = await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (signInError) {
      setError(
        signInError.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : signInError.status === 403
            ? "Your account is suspended."
            : "The email or password is incorrect."
      );
      return;
    }
    router.replace(callbackUrl ?? ROLE_HOME[roleOf(data?.user as { role?: string } | undefined)]);
    router.refresh();
  };

  const onGoogle = async () => {
    const origin = window.location.origin;
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${callbackUrl ?? "/buyer"}`,
      newUserCallbackURL: `${origin}/complete-profile`,
    });
  };

  return (
    <AuthFrame
      title="Sign in"
      description="Welcome back to Settly."
      footer={
        <div className="auth-register-prompt">
          <span>New to Settly? </span>
          <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}>Create an account</Link>
        </div>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        <div className="form-group">
          <label htmlFor="emailInput" className="form-label">Email</label>
          <div className="input-wrapper">
            <input id="emailInput" type="email" className="form-input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <PasswordField id="passwordInput" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="form-check-row" style={{ justifyContent: "flex-end" }}>
          <Link href="/forgot-password" className="form-link-forgot">Forgot password?</Link>
        </div>
        <SubmitButton loading={loading} label="Sign in" loadingLabel="Signing in…" />
      </form>
      <GoogleButton onClick={onGoogle} disabled={loading} />
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
