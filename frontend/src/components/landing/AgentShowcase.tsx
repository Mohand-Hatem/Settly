"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export function AgentShowcase() {
  const [isPinged, setIsPinged] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSimulatePing = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPinged(true);
    timerRef.current = setTimeout(() => {
      setIsPinged(false);
    }, 2800);
  };

  return (
    <section className="agents-fullwidth" id="agents">
      <div className="agents-panoramic">
        <div className="agents-col-copy">
          <div className="agents-copy-inner">
            <h2 className="agents-title">Listing on Settly, for independent agents.</h2>
            <p className="agents-desc">
              Publish verified listings, take qualified leads, run viewings and offers from one structured pipeline, and see how your units perform against the market. Verification is free.
            </p>

            <div className="agents-pillars">
              <div className="agent-pillar">
                <div className="pillar-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="pillar-text">
                  <b>0% Listing Fee</b>
                  <span>Direct verified inventory integration with zero upfront cost</span>
                </div>
              </div>

              <div className="agent-pillar">
                <div className="pillar-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="pillar-text">
                  <b>48-Hour Field Audit</b>
                  <span>Official title deed, CAD floorplan &amp; drone verification</span>
                </div>
              </div>

              <div className="agent-pillar">
                <div className="pillar-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="pillar-text">
                  <b>Pre-Qualified Ingestion</b>
                  <span>High-intent buyers with verified budgets synced to WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="agents-btns">
              <Link className="btn btn-accent" href="/register?role=agent">
                Apply as an agent
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link className="btn btn-ghost-light" href="/agents">
                See the agent tools
              </Link>
            </div>

            <div className="agents-guarantee">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Verified broker protection · Direct buyer connection · Zero commission cuts</span>
            </div>
          </div>
        </div>

        <div className="agents-col-media">
          <Image
            className="agents-bg-img"
            src="/images/7.jpg"
            alt="Modern residential exterior with a paved approach and mature planting."
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            loading="lazy"
          />
          <div className="agents-media-scrim"></div>

          {/* Live Agent Pipeline Cockpit */}
          <div
            className="agent-cockpit-card"
            id="agentCockpitCard"
            style={
              isPinged
                ? {
                    boxShadow:
                      "0 30px 75px -10px rgba(198, 151, 73, 0.4), 0 0 0 2px rgba(198, 151, 73, 0.5)",
                  }
                : undefined
            }
          >
            <div className="cockpit-header">
              <div className="cockpit-status">
                <span className="cockpit-pulse"></span>
                <span>LIVE PIPELINE · CAIRO</span>
              </div>
              <span className="cockpit-timestamp num">SYNCED · 14:02</span>
            </div>

            <div className="cockpit-lead-item">
              <div className="cockpit-lead-avatar">TE</div>
              <div className="cockpit-lead-info">
                <div className="cockpit-lead-name">
                  <b>Dr. Tarek El-Mansy</b>
                  <span className="cockpit-tag-verified">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    EGP 40M+
                  </span>
                </div>
                <p className="cockpit-lead-sub">Lake View Signature Villa · 540 m²</p>
              </div>
              <div className="cockpit-lead-action">
                <span
                  className={`cockpit-badge-state ${isPinged ? "pinged" : ""}`}
                  id="cockpitLeadState"
                >
                  {isPinged ? "WhatsApp Pinged" : "Confirmed"}
                </span>
              </div>
            </div>

            <div className="cockpit-viewing-slot">
              <div className="cockpit-slot-time">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="num">Tomorrow, 4:30 PM</span>
              </div>
              <span className="cockpit-slot-type">Private Escorted Viewing</span>
            </div>

            <div className="cockpit-benchmark">
              <div className="cockpit-bench-head">
                <span>BENCHMARK · GOLDEN SQUARE</span>
                <span className="cockpit-bench-adv num">+7.2% Advantage</span>
              </div>
              <div className="cockpit-bench-bars">
                <div className="bench-row">
                  <span className="bench-label">Your listing</span>
                  <div className="bench-track">
                    <div className="bench-fill your-unit" style={{ width: "78%" }}></div>
                  </div>
                  <span className="bench-val num">60.2k/m²</span>
                </div>
                <div className="bench-row">
                  <span className="bench-label">District avg</span>
                  <div className="bench-track">
                    <div className="bench-fill district-avg" style={{ width: "84%" }}></div>
                  </div>
                  <span className="bench-val num">64.7k/m²</span>
                </div>
              </div>
            </div>

            <div className="cockpit-footer">
              <div className="cockpit-metric">
                <b className="num">14 days</b>
                <span>avg. to offer</span>
              </div>
              <div className="cockpit-divider"></div>
              <div className="cockpit-metric">
                <b className="num">0%</b>
                <span>listing fee</span>
              </div>
              <div className="cockpit-divider"></div>
              <button
                type="button"
                className={`cockpit-test-btn ${isPinged ? "active" : ""}`}
                id="agentSimulateBtn"
                aria-label="Simulate receiving a pre-qualified lead"
                onClick={handleSimulatePing}
              >
                {isPinged ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>Lead Synced!</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>Simulate ping</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
