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

  const [activeRole, setActiveRole] = useState<"buyer" | "agent">("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    banned ? "Your account is suspended." : null
  );

  const handleRoleTabChange = (role: "buyer" | "agent") => {
    setActiveRole(role);
    setError(null);
  };

  const fillDemo = (demoEmail: string, demoRole: "buyer" | "agent") => {
    setActiveRole(demoRole);
    setEmail(demoEmail);
    setPassword("SettlyDemo2026!");
    setError(null);
    toast.success(
      `Demo ${demoRole === "buyer" ? "Buyer" : "Advisor"} credentials loaded.`
    );
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
      callbackURL: `${origin}${callbackUrl ?? (activeRole === "agent" ? "/agent" : "/buyer")}`,
      newUserCallbackURL: `${origin}/complete-profile`,
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
              TLS 1.3 encrypted session · Client funds in protected escrow accounts
            </span>
          </div>
        </>
      }
    >
      {/* Role Selector Tabs */}
      <div
        className="role-tabs"
        role="tablist"
        aria-label="Portal Access Role"
      >
        <button
          type="button"
          className={`role-tab-btn ${activeRole === "buyer" ? "active" : ""}`}
          id="tabBuyer"
          role="tab"
          aria-selected={activeRole === "buyer"}
          onClick={() => handleRoleTabChange("buyer")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="role-txt-long">Private Client</span>
          <span className="role-txt-short">Buyer</span>
        </button>

        <button
          type="button"
          className={`role-tab-btn ${activeRole === "agent" ? "active" : ""}`}
          id="tabAgent"
          role="tab"
          aria-selected={activeRole === "agent"}
          onClick={() => handleRoleTabChange("agent")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span className="role-txt-long">Certified Advisor</span>
          <span className="role-txt-short">Advisor</span>
        </button>
      </div>

      {/* Quick-Fill Demo Bar */}
      <div className="demo-fill-bar">
        <span className="demo-fill-label">Test Access:</span>
        <div className="demo-fill-btns">
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => fillDemo("buyer@settly.estate", "buyer")}
            title="Fill buyer@settly.estate"
          >
            Buyer Demo
          </button>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => fillDemo("hana.k@settly.estate", "agent")}
            title="Fill hana.k@settly.estate"
          >
            Advisor Demo
          </button>
          <button
            type="button"
            className="btn-demo-quick"
            onClick={() => {
              setActiveRole("agent");
              setEmail("admin@settly.estate");
              setPassword("SettlyDemo2026!");
              setError(null);
              toast.success("Demo Admin credentials loaded.");
            }}
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
            {activeRole === "agent" ? "ADVISOR EMAIL ADDRESS" : "PORTAL EMAIL ADDRESS"}
          </label>
          <div className="input-wrapper">
            <input
              id="emailInput"
              type="email"
              className="form-input"
              placeholder={
                activeRole === "agent"
                  ? "advisor@settly.estate"
                  : "buyer@settly.estate"
              }
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
          label={activeRole === "agent" ? "Sign in to Advisor Suite" : "Sign in to Residence Portal"}
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
