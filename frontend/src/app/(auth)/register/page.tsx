"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, safeCallbackUrl } from "@/lib/auth-client";
import { AuthFrame, FormAlert, GoogleButton, PasswordField, SubmitButton } from "../_components/AuthFrame";
import { PhoneField, toInternational } from "../_components/PhoneField";

/**
 * Register (spec S1-02). Everyone registers as a buyer (#49): no role tabs, no licence fields.
 * Phone is required, international numbers allowed (#60).
 */
function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (phone.replace(/\D/g, "").length < 7) return setError("Please enter a valid mobile number.");
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    if (!agreed) return setError("Please accept the terms to continue.");

    setLoading(true);
    const origin = window.location.origin;
    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: toInternational(dialCode, phone),
      callbackURL: `${origin}/verify-email?status=verified${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
    });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.status === 422 || signUpError.code === "USER_ALREADY_EXISTS"
          ? "An account with this email already exists. Try signing in."
          : signUpError.status === 400
            ? "Please check your details — the mobile number may be invalid."
            : signUpError.status === 429
              ? "Too many attempts. Please wait a moment and try again."
              : "We couldn't create your account. Please try again."
      );
      return;
    }
    const next = new URLSearchParams({ sent: "1", email: email.trim() });
    if (callbackUrl) next.set("callbackUrl", callbackUrl);
    router.push(`/verify-email?${next.toString()}`);
  };

  const onGoogle = async () => {
    const origin = window.location.origin;
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `${origin}${callbackUrl ?? "/buyer"}`,
      newUserCallbackURL: `${origin}/complete-profile${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
    });
  };

  return (
    <AuthFrame
      title="Create your account"
      description="Search, save and request viewings. Agents apply from their account after signing up."
      footer={
        <div className="auth-register-prompt">
          <span>Already have an account? </span>
          <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}>Sign in</Link>
        </div>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        <div className="form-group">
          <label htmlFor="nameInput" className="form-label">Full name</label>
          <div className="input-wrapper">
            <input id="nameInput" className="form-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="emailInput" className="form-label">Email</label>
          <div className="input-wrapper">
            <input id="emailInput" type="email" className="form-input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <PhoneField dialCode={dialCode} onDialCodeChange={setDialCode} value={phone} onChange={setPhone} />
        <PasswordField id="passwordInput" label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
        <div className="form-check-row">
          <label className="checkbox-label">
            <input type="checkbox" className="custom-checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>I agree to the terms of use and privacy policy.</span>
          </label>
        </div>
        <SubmitButton loading={loading} label="Create account" loadingLabel="Creating your account…" />
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
