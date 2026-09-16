"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/api/client";

interface CountryOption {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES: CountryOption[] = [
  { name: "Egypt", code: "+20", flag: "🇪🇬" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼" },
  { name: "Qatar", code: "+974", flag: "🇶🇦" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Switzerland", code: "+41", flag: "🇨🇭" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "agent">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Advisor fields
  const [firmName, setFirmName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Buyer field
  const [corridor, setCorridor] = useState("golden-square");

  // Terms agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Password strength logic
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Enter 8+ characters", color: "transparent" };
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;

    switch (s) {
      case 1:
        return { score: 1, label: "Weak — Add numbers & symbols", color: "#991B1B" };
      case 2:
        return { score: 2, label: "Fair — Add uppercase & symbols", color: "#C69749" };
      case 3:
        return { score: 3, label: "Good — Add special characters", color: "#2B3A61" };
      case 4:
        return { score: 4, label: "Strong sovereign credential", color: "#3D5A4C" };
      default:
        return { score: 0, label: "Enter 8+ characters", color: "transparent" };
    }
  }, [password]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.includes(q)
    );
  }, [countrySearch]);

  const fillDemoRegister = (
    demoName: string,
    demoEmail: string,
    demoDial: string,
    demoPhone: string,
    demoPass: string,
    demoRole: "buyer" | "agent"
  ) => {
    setRole(demoRole);
    setName(demoName);
    setEmail(demoEmail);
    const matched = COUNTRIES.find((c) => c.code === demoDial) || COUNTRIES[0];
    setSelectedCountry(matched);
    setPhone(demoPhone);
    setPassword(demoPass);
    if (demoRole === "agent") {
      setFirmName("Elite Realty Advisors");
      setLicenseNumber("BRK-EG #8841-B");
    }
    setAgreedToTerms(true);
    setErrorMessage(null);
    triggerToast(`Demo ${demoRole === "buyer" ? "Buyer" : "Advisor"} registration populated.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your legal principal or advisor name.");
      return;
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid authorized email address.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("Please enter a valid direct contact number.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters with letters & numbers.");
      return;
    }

    if (role === "agent") {
      if (!firmName.trim()) {
        setErrorMessage("Please enter your advisory firm or brokerage name.");
        return;
      }
      if (!licenseNumber.trim()) {
        setErrorMessage("Please provide your valid real estate broker license number.");
        return;
      }
    }

    if (!agreedToTerms) {
      setErrorMessage("You must accept Settly's Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      // 1. Better Auth Sign-Up
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to create account. Please check your information.");
        setLoading(false);
        return;
      }

      if (data) {
        // 2. If Agent, submit AgentProfile
        if (role === "agent") {
          try {
            await apiClient.POST("/api/v1/me/agent-profile", {
              body: {
                licenseNumber,
                brokerageName: firmName,
              },
            });
          } catch {
            // Non-blocking profile registration
          }
        }

        triggerToast("Account generated successfully. Routing to verification console...");
        setTimeout(() => {
          router.push(`/verify-email?registered=true&email=${encodeURIComponent(email)}`);
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected registration error occurred.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleGoogleSso = async () => {
    triggerToast("Initiating encrypted Google corporate onboarding...");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: role === "agent" ? "/agent-dashboard/overview" : "/buyer-dashboard/overview",
      });
    } catch {
      triggerToast("Google SSO gateway redirecting...");
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Pane: Architectural Scrim & Institutional Credentials (50%) */}
      <div className="auth-brand-pane">
        <div className="auth-brand-bg">
          <img
            src="/images/1.jpg"
            alt="Settly Prime Egyptian Architecture"
            loading="lazy"
          />
        </div>
        <div className="auth-brand-scrim" />

        <div className="auth-brand-content">
          {/* Top Link */}
          <div className="auth-top-nav">
            <Link href="/" className="brand-link-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              &ldquo;Direct access to Egypt&apos;s verified prime inventory. Zero phantom listings. Complete title deed verification.&rdquo;
            </h2>
            <p className="auth-quote-caption">
              Create your account to browse verified property listings, request viewings, and submit offers with protected reservation deposits.
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

      {/* Right Pane: Onboarding Form (50%) */}
      <div className="auth-form-pane">
        <div className="auth-card">
          {/* Card Header */}
          <div className="auth-card-header">
            <div className="auth-logo-row">
              <Link href="/" className="auth-logo-link">
                <img
                  src="/images/logo.png"
                  alt="Settly Mark"
                  className="auth-logo-img"
                />
                <span className="auth-logo-text">Settly</span>
              </Link>
              <span className="auth-security-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="badge-txt-long">Confidential Onboarding</span>
                <span className="badge-txt-short">Verified</span>
              </span>
            </div>

            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-desc">
              Join verified buyers and licensed advisors on Settly&apos;s premium real estate platform.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="role-tabs" role="tablist" aria-label="Portal Access Role">
            <button
              type="button"
              className={`role-tab-btn ${role === "buyer" ? "active" : ""}`}
              role="tab"
              aria-selected={role === "buyer"}
              onClick={() => {
                setRole("buyer");
                setErrorMessage(null);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="role-txt-long">Private Client</span>
              <span className="role-txt-short">Buyer</span>
            </button>
            <button
              type="button"
              className={`role-tab-btn ${role === "agent" ? "active" : ""}`}
              role="tab"
              aria-selected={role === "agent"}
              onClick={() => {
                setRole("agent");
                setErrorMessage(null);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                onClick={() =>
                  fillDemoRegister(
                    "Tarek Mansour",
                    "tarek.mansour@settly.com",
                    "+20",
                    "1001234567",
                    "Settly#Elite2026",
                    "buyer"
                  )
                }
                title="Fill Buyer Registration"
              >
                Buyer Demo
              </button>
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() =>
                  fillDemoRegister(
                    "Karim El-Sayed",
                    "karim.sayed@settly-advisors.eg",
                    "+20",
                    "1229876543",
                    "Settly#Advisor2026",
                    "agent"
                  )
                }
                title="Fill Advisor Registration"
              >
                Advisor Demo
              </button>
            </div>
          </div>

          {/* Register Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="nameInput" className="form-label">
                {role === "buyer" ? "LEGAL PRINCIPAL NAME" : "LEGAL ADVISOR NAME"}
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="nameInput"
                  className="form-input"
                  placeholder="e.g. Tarek Mansour"
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
                {role === "buyer" ? "PORTAL EMAIL ADDRESS" : "PROFESSIONAL ADVISOR EMAIL"}
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="emailInput"
                  className="form-input"
                  placeholder={role === "buyer" ? "name@institution.com" : "karim.sayed@settly-advisors.eg"}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* International Phone / WhatsApp */}
            <div className="form-group">
              <label htmlFor="phoneInput" className="form-label">DIRECT MOBILE / WHATSAPP</label>
              <div className="phone-group">
                {/* Custom Luxury Country Picker */}
                <div className="country-picker-wrap">
                  <button
                    type="button"
                    className="country-picker-btn"
                    aria-haspopup="listbox"
                    aria-expanded={isCountryPickerOpen}
                    onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)}
                  >
                    <span className="country-picker-flag" style={{ fontSize: "16px" }}>
                      {selectedCountry.flag}
                    </span>
                    <span className="country-picker-code">{selectedCountry.code}</span>
                    <svg className="country-picker-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Floating Luxury Popover */}
                  <div className={`country-picker-popover ${isCountryPickerOpen ? "open" : ""}`} role="listbox">
                    <div className="country-search-box">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="country-search-input"
                        placeholder="Search country or code..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        autoFocus={isCountryPickerOpen}
                      />
                    </div>
                    <div className="country-options-list">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code + c.name}
                          type="button"
                          className={`country-option-item ${selectedCountry.code === c.code ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedCountry(c);
                            setIsCountryPickerOpen(false);
                            setCountrySearch("");
                          }}
                        >
                          <div className="country-option-main">
                            <span style={{ fontSize: "16px" }}>{c.flag}</span>
                            <span className="country-option-name">{c.name}</span>
                          </div>
                          <span className="country-option-code">{c.code}</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div className="country-no-results">No countries found</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="input-wrapper" style={{ flex: 1 }}>
                  <input
                    type="tel"
                    id="phoneInput"
                    className="form-input"
                    placeholder="100 123 4567"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password with Strength Meter */}
            <div className="form-group">
              <label htmlFor="passwordInput" className="form-label">
                <span className="lbl-txt-long">SECURITY CREDENTIAL</span>
                <span className="lbl-txt-short">CREDENTIAL</span>
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="passwordInput"
                  className="form-input input-with-action"
                  placeholder="Create strong credential"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Strength Indicator */}
              <div className="strength-container">
                <div className="strength-bar-track">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className="strength-segment"
                      style={{
                        background:
                          passwordStrength.score >= seg
                            ? passwordStrength.color
                            : "transparent",
                      }}
                    />
                  ))}
                </div>
                <div className="strength-meta-row">
                  <span>Argon2id Hash Standard</span>
                  <span className="strength-state-text" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Advisor Fields */}
            {role === "agent" ? (
              <div className="dynamic-advisor-fields">
                <div className="form-group">
                  <label htmlFor="firmInput" className="form-label">ADVISORY FIRM / PRIVATE DESK</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="firmInput"
                      className="form-input"
                      placeholder="e.g. Elite Realty Advisors"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="licenseInput" className="form-label">BROKER LICENSE NUMBER</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      id="licenseInput"
                      className="form-input"
                      placeholder="BRK-EG #8841-B"
                      style={{ fontFamily: "var(--mono-val)" }}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Corridor Selector (Buyer) */
              <div className="form-group">
                <label htmlFor="corridorSelect" className="form-label">PRIMARY CORRIDOR OF INTEREST</label>
                <select
                  id="corridorSelect"
                  className="form-select"
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                >
                  <option value="golden-square">Golden Square & New Cairo Belts</option>
                  <option value="sheikh-zayed">Sheikh Zayed & New Zayed (West Cairo)</option>
                  <option value="ras-el-hekma">Ras El Hekma & North Coast (Sahel)</option>
                  <option value="red-sea">Red Sea & El Gouna Marine Estates</option>
                  <option value="nac">New Administrative Capital (Diplomatic Belt)</option>
                </select>
              </div>
            )}

            {/* Terms Agreement Checkbox */}
            <div className="form-check-row">
              <input
                type="checkbox"
                id="termsCheck"
                className="custom-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              <label htmlFor="termsCheck" className="checkbox-label">
                I agree to Settly&apos;s <a href="#" onClick={(e) => { e.preventDefault(); triggerToast("Settly Master Platform Terms: 256-bit encrypted escrow covenants."); }}>Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); triggerToast("Settly Confidentiality Policy: Fiduciary client privilege protected."); }}>Privacy Policy</a>.
              </label>
            </div>

            {errorMessage && (
              <span className="field-error-msg">{errorMessage}</span>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              className={`btn-auth-submit ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Generating Sovereign Cryptographic Identity...</span>
                </>
              ) : (
                <>
                  <span>Create Verified Account</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">OR REGISTER VIA ENTERPRISE SSO</div>

          {/* SSO Google Button */}
          <button type="button" className="btn-sso" onClick={handleGoogleSso}>
            <svg width="18" height="18" viewBox="0 0 24 24">
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
            <span className="sso-txt-long">Continue with Google Corporate SSO</span>
            <span className="sso-txt-short">Continue with Google SSO</span>
          </button>

          {/* Sign In Prompt */}
          <div className="auth-register-prompt">
            <span>Already have an authorized account? </span>
            <Link href="/login">Sign in to portal &rarr;</Link>
          </div>

          {/* Escrow & Security Trustline */}
          <div className="auth-card-footer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Verified Listings &amp; Secure Deposit Protection</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <div className={`auth-toast ${toastMessage ? "show" : ""}`}>
        <svg className="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
