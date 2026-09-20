"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export function AuthFrame({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      {/* Left Pane: Architectural Scrim & Institutional Credentials (50%) */}
      <div className="auth-brand-pane">
        <div className="auth-brand-bg relative w-full h-full">
          <Image
            src="/images/hero.jpg"
            alt="Settly Luxury Architecture"
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
        </div>
        <div className="auth-brand-scrim" />

        <div className="auth-brand-content">
          {/* Top Link & TLS Badge */}
          <div className="auth-top-nav">
            <Link href="/" className="brand-link-back">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Return to Public Exchange</span>
            </Link>

            <span
              className="auth-security-badge"
              style={{
                background: "rgba(61, 90, 76, 0.35)",
                color: "#FFFFFF",
                border: "1px solid rgba(61, 90, 76, 0.5)",
              }}
            >
              <svg
                width="12"
                height="12"
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
              TLS 1.3 256-BIT
            </span>
          </div>

          {/* Central Broadsheet Quote */}
          <div className="auth-brand-quote">
            <div className="auth-quote-tag">Verified Real Estate Platform</div>
            <h2 className="auth-quote-text">
              &ldquo;Every listing verified. Every title deed authenticated. Every reservation deposit protected with a 48-hour refund policy.&rdquo;
            </h2>
            <p className="auth-quote-caption">
              Settly connects discerning buyers with Egypt&apos;s most exclusive residences and certified licensed advisors.
            </p>
          </div>

          {/* Bottom Telemetry Ribbon */}
          <div className="auth-pillars-grid">
            <div className="pillar-item">
              <span className="pillar-val">EGP 14.8B</span>
              <span className="pillar-lbl">Audited Volume</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-val">48-Hour</span>
              <span className="pillar-lbl">Refund Window</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-val">100%</span>
              <span className="pillar-lbl">Licensed Brokers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Fiduciary Access Form (50%) */}
      <div className="auth-form-pane">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo-row">
              <Link href="/" className="auth-logo-link">
                <Image
                  src="/images/logo.png"
                  alt="Settly Mark"
                  width={32}
                  height={32}
                  className="auth-logo-img"
                />
                <span className="auth-logo-text">Settly</span>
              </Link>
              <span className="auth-security-badge">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="badge-txt-long">Verified Portal</span>
                <span className="badge-txt-short">Verified</span>
              </span>
            </div>
            <h1 className="auth-card-title">{title}</h1>
            {description && <p className="auth-card-desc">{description}</p>}
          </div>

          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="field-error-msg block mb-3 text-xs font-medium text-error">
      {message}
    </p>
  );
}

export function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      className={`btn-auth-submit ${loading ? "loading" : ""}`}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}

export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="auth-divider">OR</div>
      <button
        type="button"
        className="btn-sso"
        onClick={onClick}
        disabled={disabled}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    </>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••••••",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="input-wrapper">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="form-input input-with-action"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          minLength={8}
        />
        <button
          type="button"
          className="btn-input-eye"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="w-4 h-4 text-ink-3 hover:text-navy-900 transition-colors" />
          ) : (
            <Eye className="w-4 h-4 text-ink-3 hover:text-navy-900 transition-colors" />
          )}
        </button>
      </div>
    </div>
  );
}
