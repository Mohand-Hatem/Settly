import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, CheckCircle2, CreditCard } from "lucide-react";

export function Footer() {
  return (
    <footer className="settly-master-footer">
      <div className="settly-footer-shell">
        <div className="settly-footer-grid">
          {/* Col 1: Brand Authority & Escrow */}
          <div className="settly-ftr-brand">
            <Link href="/" className="brand" style={{ marginBottom: "1.25rem" }}>
              <Image
                src="/images/logo.png"
                alt="Settly Logo"
                width={38}
                height={38}
                className="ftr-logo-plate"
              />
              <span style={{ color: "#fff" }}>Settly</span>
            </Link>
            <p className="settly-ftr-desc">
              Settly is Egypt&apos;s premier verified luxury real estate platform. Discover curated residential properties and prime developments with transparent pricing and secure deposit protection across Greater Cairo and the North Coast.
            </p>
            <div className="settly-trust-badges">
              <div className="settly-trust-badge-row">
                <Shield className="w-3.5 h-3.5 text-brass shrink-0" />
                <span>Verified Listings &amp; Direct Developer Units</span>
              </div>
              <div className="settly-trust-badge-row">
                <CheckCircle2 className="w-3.5 h-3.5 text-brass shrink-0" />
                <span>Tier-1 Licensed Master Developer Exchange</span>
              </div>
              <div className="settly-trust-badge-row">
                <CreditCard className="w-3.5 h-3.5 text-brass shrink-0" />
                <span>100% Freehold Foreign Ownership Guarantee</span>
              </div>
            </div>
          </div>

          {/* Col 2: Investment Corridors */}
          <div className="settly-ftr-col">
            <h4>Prime Corridors</h4>
            <ul className="settly-ftr-links">
              <li>
                <Link href="/areas">Golden Square (New Cairo)</Link>
              </li>
              <li>
                <Link href="/search?corridor=sahel">Ras El Hekma (North Coast)</Link>
              </li>
              <li>
                <Link href="/search?corridor=zayed">New Zayed (Karmell &amp; Rivers)</Link>
              </li>
              <li>
                <Link href="/search?corridor=gouna">El Gouna Waterfront Estates</Link>
              </li>
              <li>
                <Link href="/search?corridor=sidiheneish">Sidi Heneish Azure Bay</Link>
              </li>
              <li>
                <Link href="/areas">All 8 Corridors &amp; GIS Radar &rarr;</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Institutional Intelligence */}
          <div className="settly-ftr-col">
            <h4>Intelligence &amp; Tools</h4>
            <ul className="settly-ftr-links">
              <li>
                <Link href="/market-insights">Macro Intelligence (Q1 2026)</Link>
              </li>
              <li>
                <Link href="/market-insights#yieldArbitrage">Yield Arbitrage Terminal</Link>
              </li>
              <li>
                <Link href="/market-insights#developerLeague">Developer Punctuality Table</Link>
              </li>
              <li>
                <Link href="/compare">Compare 4 Residences Side-by-Side</Link>
              </li>
              <li>
                <Link href="/search">Verified Properties Search</Link>
              </li>
              <li>
                <Link href="/agents">Certified Agent Directory</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Private Client Advisory & Desk */}
          <div className="settly-ftr-col">
            <h4>Private Client Desk</h4>
            <div className="settly-ftr-advisory">
              <p>
                Dedicated advisory and viewing support for luxury property buyers, investors, and international clients.
              </p>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ftr-concierge"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                <span>Chat on WhatsApp</span>
              </a>
              <div className="settly-ftr-hours">
                Daily 09:00 — 21:00 CLT · Cairo / Dubai / London
              </div>

              {/* Social Media Strip */}
              <div className="settly-socials-block">
                <span className="settly-socials-label">Connect with Settly:</span>
                <div className="settly-socials-strip">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="settly-social-icon"
                    aria-label="Settly on Instagram"
                    title="Instagram"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="settly-social-icon"
                    aria-label="Settly on LinkedIn"
                    title="LinkedIn"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="settly-social-icon"
                    aria-label="Settly on Facebook"
                    title="Facebook"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="settly-social-icon"
                    aria-label="Settly on X"
                    title="X (Twitter)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="settly-footer-bottom">
          <div className="settly-ftr-legal">
            © 2026 Settly Real Estate Technologies. All rights reserved. Transparent pricing and secure deposit protection.
          </div>
          <div className="settly-ftr-socials">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/terms#security">Deposit Protection</Link>
            <Link href="/market-insights">Market Insights</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
