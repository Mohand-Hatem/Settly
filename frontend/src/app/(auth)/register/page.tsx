"use client";

import React, { Suspense, useState, useId } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, safeCallbackUrl } from "@/lib/auth-client";
import {
  AuthFrame,
  FormAlert,
  GoogleButton,
  PasswordField,
  SubmitButton,
} from "../_components/AuthFrame";
import { PhoneField, toInternational } from "../_components/PhoneField";
import { toast } from "@/components/ui/Toaster";

/**
 * Register screen matching docs/design/candidates/settly-landing/auth/register.html.
 * Role switcher tabs allow choosing Private Client vs Certified Advisor.
 * Features country flag phone selector, 4-segment password strength meter, and demo quick-fill.
 */
function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const termsId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute password score (0 to 4)
  const getPasswordScore = (val: string): number => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  };

  const passwordScore = getPasswordScore(password);

  const getStrengthMeta = (score: number, val: string) => {
    if (!val) {
      return { text: "Enter 8+ characters", color: "var(--ink-3)" };
    }
    switch (score) {
      case 1:
        return { text: "Weak", color: "var(--error)" };
      case 2:
        return { text: "Fair", color: "#D97706" };
      case 3:
        return { text: "Good", color: "var(--brass)" };
      case 4:
        return { text: "Strong", color: "var(--sage)" };
      default:
        return { text: "Weak", color: "var(--error)" };
    }
  };

  const strengthMeta = getStrengthMeta(passwordScore, password);

  const getSegmentColor = (index: number, score: number) => {
    if (index >= score) return "transparent";
    switch (score) {
      case 1:
        return "var(--error)";
      case 2:
        return "#D97706";
      case 3:
        return "var(--brass)";
      case 4:
        return "var(--sage)";
      default:
        return "transparent";
    }
  };

  const fillDemo = () => {
    setName("Omar Mostafa");
    setEmail("omar.buyer@settly.estate");
    setDialCode("+20");
    setPhone("1001234567");
    setPassword("ClientPass#2026");
    setAgreed(true);
    setError(null);
    toast.success("Demo Buyer details loaded.");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid mobile phone number.");
      return;
    }
    if (password.length < 8) {
      setError("Your security credential must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("Please acknowledge and accept the terms to continue.");
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: toInternational(dialCode, phone),
      callbackURL: `${origin}/verify-email?status=verified${
        callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
      }`,
    });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.status === 422 || signUpError.code === "USER_ALREADY_EXISTS"
          ? "An account with this email already exists. Try signing in instead."
          : signUpError.status === 400
            ? "Please check your details — the mobile number or formatting may be invalid."
            : signUpError.status === 429
              ? "Too many attempts. Please wait a moment and try again."
              : "We couldn't create your account. Please try again."
      );
      return;
    }

    toast.success("Account created successfully! Verification email dispatched.");
    const next = new URLSearchParams({ sent: "1", email: email.trim() });
    if (callbackUrl) next.set("callbackUrl", callbackUrl);
    router.push(`/verify-email?${next.toString()}`);
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
      title="Create your account"
      description="Discover residences, schedule verified viewings, and submit secure purchase reservations."
      footer={
        <>
          <div className="auth-register-prompt">
            <span>Already have an account? </span>
            <Link
              href={
                callbackUrl
                  ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : "/login"
              }
            >
              Sign in
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
            onClick={fillDemo}
            title="Auto-fill Buyer Demo details"
          >
            Buyer Demo
          </button>
        </div>
      </div>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />

        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="nameInput" className="form-label">
            FULL LEGAL NAME
          </label>
          <div className="input-wrapper">
            <input
              id="nameInput"
              type="text"
              className="form-input"
              placeholder="Tarek Mansour"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="emailInput" className="form-label">
            EMAIL ADDRESS
          </label>
          <div className="input-wrapper">
            <input
              id="emailInput"
              type="email"
              className="form-input"
              placeholder="buyer@settly.estate"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Country Phone Field with custom country flag picker */}
        <PhoneField
          dialCode={dialCode}
          onDialCodeChange={setDialCode}
          value={phone}
          onChange={setPhone}
          label="DIRECT MOBILE NUMBER"
          note="Never shown publicly. Disclosed only under active fiduciary offer reservations."
        />

        {/* Password & 4-segment Strength Meter */}
        <div className="form-group">
          <PasswordField
            id="passwordInput"
            label="SECURITY CREDENTIAL"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            placeholder="8+ characters with mixed case & numbers"
          />

          {/* 4-Segment Strength Indicator */}
          <div className="strength-container" aria-live="polite">
            <div className="strength-bar-track">
              <div
                className="strength-segment"
                style={{ background: getSegmentColor(0, passwordScore) }}
              />
              <div
                className="strength-segment"
                style={{ background: getSegmentColor(1, passwordScore) }}
              />
              <div
                className="strength-segment"
                style={{ background: getSegmentColor(2, passwordScore) }}
              />
              <div
                className="strength-segment"
                style={{ background: getSegmentColor(3, passwordScore) }}
              />
            </div>
            <div className="strength-meta-row">
              <span>Argon2id Hash Standard</span>
              <span
                className="strength-state-text"
                style={{ color: strengthMeta.color }}
              >
                {strengthMeta.text}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Privacy */}
        <div className="form-check-row">
          <input
            id={termsId}
            type="checkbox"
            className="custom-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
          />
          <label htmlFor={termsId} className="checkbox-label">
            I accept Settly&apos;s{" "}
            <Link href="/terms" className="text-navy-900 font-semibold underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-navy-900 font-semibold underline">
              Fiduciary Privacy Policy
            </Link>
            .
          </label>
        </div>

        <SubmitButton
          loading={loading}
          label="Create Account"
          loadingLabel="Creating verified account…"
        />
      </form>

      <GoogleButton onClick={onGoogle} disabled={loading} />
    </AuthFrame>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
