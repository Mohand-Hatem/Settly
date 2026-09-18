import React from "react";
import Link from "next/link";

/**
 * Shared frame for the auth screens (spec S1-02…S1-06): brand pane + form card, on the existing
 * auth.css styles. Copy is factual — no invented figures or unsupported claims (#45, A4, C-3).
 */
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
      <div className="auth-brand-pane">
        <div className="auth-brand-bg">
          <img src="/images/1.jpg" alt="" loading="lazy" />
        </div>
        <div className="auth-brand-scrim" />
        <div className="auth-brand-content">
          <div className="auth-top-nav">
            <Link href="/" className="brand-link-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Settly</span>
            </Link>
          </div>
          <div className="auth-brand-quote">
            <div className="auth-quote-tag">Real estate across Egypt</div>
            <h2 className="auth-quote-text">
              Find a home, book a viewing with a verified agent, and follow every step in one place.
            </h2>
            <p className="auth-quote-caption">
              Browse freely. A verified email is needed only to request viewings and make offers.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-form-pane">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-logo-row">
              <Link href="/" className="auth-logo-link">
                <img src="/images/logo.png" alt="" className="auth-logo-img" />
                <span className="auth-logo-text">Settly</span>
              </Link>
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
    <p role="alert" className="field-error-msg" style={{ display: "block", marginBottom: 12 }}>
      {message}
    </p>
  );
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button type="submit" className={`btn-auth-submit ${loading ? "loading" : ""}`} disabled={loading}>
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

export function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <>
      <div className="auth-divider">OR</div>
      <button type="button" className="btn-sso" onClick={onClick} disabled={disabled}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
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
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
