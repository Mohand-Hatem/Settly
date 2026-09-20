"use client";

import React, { useState, useRef, useEffect } from "react";

export interface CountryItem {
  code: string;
  iso: string;
  name: string;
  placeholder: string;
  flag: React.ReactNode;
}

export const COUNTRIES_DATA: CountryItem[] = [
  {
    code: "+20",
    iso: "EG",
    name: "Egypt",
    placeholder: "100 123 4567",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="5.33" fill="#CE1126" />
        <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
        <rect y="10.67" width="24" height="5.33" fill="#000000" />
        <circle cx="12" cy="8" r="1.3" fill="#C69749" />
      </svg>
    ),
  },
  {
    code: "+971",
    iso: "AE",
    name: "United Arab Emirates",
    placeholder: "50 123 4567",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="5.33" fill="#00732F" />
        <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
        <rect y="10.67" width="24" height="5.33" fill="#000000" />
        <rect width="6" height="16" fill="#FF0000" />
      </svg>
    ),
  },
  {
    code: "+966",
    iso: "SA",
    name: "Saudi Arabia",
    placeholder: "50 123 4567",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#006C35" />
        <path d="M6 10.5h12v1H6zm2-3h8v1.5H8z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    code: "+965",
    iso: "KW",
    name: "Kuwait",
    placeholder: "9123 4567",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="5.33" fill="#007A3D" />
        <rect y="5.33" width="24" height="5.34" fill="#FFFFFF" />
        <rect y="10.67" width="24" height="5.33" fill="#CE1126" />
        <polygon points="0,0 6,5.33 6,10.67 0,16" fill="#000000" />
      </svg>
    ),
  },
  {
    code: "+974",
    iso: "QA",
    name: "Qatar",
    placeholder: "3312 3456",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#8D1B3D" />
        <polygon
          points="0,0 6,0 8,1.6 6,3.2 8,4.8 6,6.4 8,8 6,9.6 8,11.2 6,12.8 8,14.4 6,16 0,16"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    code: "+44",
    iso: "GB",
    name: "United Kingdom",
    placeholder: "7911 123456",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#012169" />
        <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="2.6" />
        <path d="M0 0L24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.3" />
        <path d="M12 0v16M0 8h24" stroke="#FFFFFF" strokeWidth="4.5" />
        <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.7" />
      </svg>
    ),
  },
  {
    code: "+1",
    iso: "US",
    name: "United States",
    placeholder: "212 555 0199",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#B22234" />
        <path
          d="M0 2.46h24M0 4.92h24M0 7.38h24M0 9.84h24M0 12.3h24M0 14.76h24"
          stroke="#FFFFFF"
          strokeWidth="1.23"
        />
        <rect width="10" height="8.6" fill="#3C3B6E" />
        <circle cx="2.5" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="5" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="7.5" cy="2.2" r="0.6" fill="#FFFFFF" />
        <circle cx="3.75" cy="4.3" r="0.6" fill="#FFFFFF" />
        <circle cx="6.25" cy="4.3" r="0.6" fill="#FFFFFF" />
        <circle cx="2.5" cy="6.4" r="0.6" fill="#FFFFFF" />
        <circle cx="5" cy="6.4" r="0.6" fill="#FFFFFF" />
        <circle cx="7.5" cy="6.4" r="0.6" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    code: "+49",
    iso: "DE",
    name: "Germany",
    placeholder: "151 23456789",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="5.33" fill="#000000" />
        <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </svg>
    ),
  },
  {
    code: "+33",
    iso: "FR",
    name: "France",
    placeholder: "6 12 34 56 78",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="8" height="16" fill="#002395" />
        <rect x="8" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" width="8" height="16" fill="#ED2939" />
      </svg>
    ),
  },
  {
    code: "+41",
    iso: "CH",
    name: "Switzerland",
    placeholder: "79 123 45 67",
    flag: (
      <svg className="flag-icon" viewBox="0 0 24 16" aria-hidden>
        <rect width="24" height="16" fill="#D52B1E" />
        <rect x="10" y="3.5" width="4" height="9" fill="#FFFFFF" />
        <rect x="7.5" y="6" width="9" height="4" fill="#FFFFFF" />
      </svg>
    ),
  },
];

/** Builds an international number; a leading 0 of a local number is dropped. */
export function toInternational(dialCode: string, local: string): string {
  const digits = local.replace(/[^\d]/g, "").replace(/^0+/, "");
  return `${dialCode}${digits}`;
}

export function PhoneField({
  dialCode,
  onDialCodeChange,
  value,
  onChange,
  label = "Mobile phone number",
  note = "Never shown publicly. An agent sees it only while you have an active offer on their listing.",
  required = true,
}: {
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  note?: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentCountry =
    COUNTRIES_DATA.find((c) => c.code === dialCode) || COUNTRIES_DATA[0];

  const filteredCountries = COUNTRIES_DATA.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  });

  // Handle outside clicks to close the popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelectCountry = (code: string) => {
    onDialCodeChange(code);
    setIsOpen(false);
  };

  return (
    <div className="form-group">
      <label htmlFor="phoneInput" className="form-label">
        {label}
      </label>
      <div className="phone-group">
        {/* Custom Country Flag Dropdown */}
        <div className="country-picker-wrap" ref={popoverRef}>
          <button
            type="button"
            className="country-picker-btn"
            id="countryPickerBtn"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            onClick={() => setIsOpen(!isOpen)}
            title="Select country code"
          >
            <span className="country-picker-flag">{currentCountry.flag}</span>
            <span className="country-picker-code">{currentCountry.code}</span>
            <svg
              className="country-picker-chevron"
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
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Popover Dropdown */}
          <div
            className={`country-picker-popover ${isOpen ? "open" : ""}`}
            role="listbox"
            aria-label="Country Codes"
          >
            <div className="country-search-box">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country or code…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="country-options-list">
              {filteredCountries.length === 0 ? (
                <div className="country-no-results">No matching countries</div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === currentCountry.code;
                  return (
                    <button
                      key={c.iso}
                      type="button"
                      className={`country-option-item ${
                        isSelected ? "selected" : ""
                      }`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCountry(c.code)}
                    >
                      <div className="country-option-main">
                        <span className="country-picker-flag">{c.flag}</span>
                        <span className="country-option-name">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="country-option-code">{c.code}</span>
                        {isSelected && (
                          <svg
                            className="country-option-check"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Local Number Input */}
        <div className="input-wrapper flex-1">
          <input
            id="phoneInput"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="form-input"
            placeholder={currentCountry.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          />
        </div>
      </div>
      {note && <p className="auth-card-desc mt-1.5 text-xs">{note}</p>}
    </div>
  );
}
