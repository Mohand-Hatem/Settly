"use client";

import React from "react";

const COUNTRIES = [
  { name: "Egypt", code: "+20" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "Kuwait", code: "+965" },
  { name: "Qatar", code: "+974" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States / Canada", code: "+1" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
];

/** Builds an international number; a leading 0 of a local number is dropped. */
export function toInternational(dialCode: string, local: string): string {
  const digits = local.replace(/[^\d]/g, "").replace(/^0+/, "");
  return `${dialCode}${digits}`;
}

/** Phone is required and international numbers are allowed (#60). Collected, never verified (#53). */
export function PhoneField({
  dialCode,
  onDialCodeChange,
  value,
  onChange,
}: {
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="form-group">
      <label htmlFor="phoneInput" className="form-label">
        Mobile number
      </label>
      <div className="phone-group">
        <select
          aria-label="Country code"
          className="form-select"
          value={dialCode}
          onChange={(e) => onDialCodeChange(e.target.value)}
          style={{ maxWidth: 130 }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} {c.name}
            </option>
          ))}
        </select>
        <div className="input-wrapper" style={{ flex: 1 }}>
          <input
            id="phoneInput"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="form-input"
            placeholder="1001234567"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
          />
        </div>
      </div>
      <p className="auth-card-desc" style={{ marginTop: 6, fontSize: 12 }}>
        Never shown publicly. An agent sees it only while you have an offer on their listing.
      </p>
    </div>
  );
}
