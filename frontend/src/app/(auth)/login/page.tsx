"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, ROLE_HOME, roleOf, safeCallbackUrl } from "@/lib/auth-client";
import {
  AuthFrame,
  FormAlert,
  GoogleButton,
  PasswordField,
  SubmitButton,
} from "../_components/AuthFrame";
import { toast } from "@/components/ui/Toaster";

/**
 * Login (spec S1-03) matching docs/design/candidates/settly-landing/auth/login.html.
 * Role selector tabs allow switching perspective; one login for all roles with role-based routing.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const banned = params.get("error") === "banned";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    banned ? "Your account is suspended." : null
  );

  const fillDemo = (demoEmail: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword("SettlyDemo2026!");
    setError(null);
    toast.success(`Demo ${roleName} credentials loaded.`);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
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

    toast.success("Authentication successful. Redirecting…");
    const userRole = roleOf(data?.user as { role?: string } | undefined);
    router.replace(callbackUrl ?? ROLE_HOME[userRole]);
    router.refresh();
  };

  const onGoogle = async () => {
    const origin = window.location.origin;
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${callbackUrl ?? "/buyer"}`,
      newUserCallbackURL: `${origin}/complete-profile${
        callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
      }`,
    });
  };

  return (
    <AuthFrame
      title="Sign in to your account"
      description="Enter your credentials to access your saved properties, scheduled viewings, active offers, and account."
      footer={
        <>
          <div className="auth-register-prompt">
            <span>New to Settly? </span>
            <Link
              href={
                callbackUrl
                  ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/register"
              }
            >
              Create an account
            </Link>
          </div>

          <div className="auth-card-footer">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>
              TLS 1.3 encrypted session · Verified reservation deposits &amp; title due diligence
            </span>
          </div>
        </>
      }
    >
      {/* Quick-Fill Demo Bar */}
      <div className="demo-fill-bar">
        <span className="demo-fill-label">Test Access:</span>
        <div className="demo-fill-btns">
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => fillDemo("buyer@settly.estate", "Buyer")}
            title="Fill buyer@settly.estate"
          >
            Buyer Demo
          </button>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => fillDemo("hana.k@settly.estate", "Advisor")}
            title="Fill hana.k@settly.estate"
          >
            Advisor Demo
          </button>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => fillDemo("admin@settly.estate", "Admin")}
            title="Fill admin@settly.estate"
          >
            Admin Demo
          </button>
        </div>
      </div>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />

        <div className="form-group">
          <label htmlFor="emailInput" className="form-label">
            PORTAL EMAIL ADDRESS
          </label>
          <div className="input-wrapper">
            <input
              id="emailInput"
              type="email"
              className="form-input"
              placeholder="name@settly.estate"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label htmlFor="passwordInput" className="form-label">
              <span className="lbl-txt-long">SECURITY CREDENTIAL</span>
              <span className="lbl-txt-short">CREDENTIAL</span>
            </label>
            <Link href="/forgot-password" className="form-link-forgot">
              <span className="forgot-txt-long">Forgot credential?</span>
              <span className="forgot-txt-short">Forgot?</span>
            </Link>
          </div>
          <PasswordField
            id="passwordInput"
            label=""
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>

        <SubmitButton
          loading={loading}
          label="Sign in to Settly"
          loadingLabel="Authorizing credentials…"
        />
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
