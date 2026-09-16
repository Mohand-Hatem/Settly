"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Maximize2, ArrowRight, ShieldCheck } from "lucide-react";

export function SettlyAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "agent">("chat");
  const [viewingConfirmed, setViewingConfirmed] = useState(false);

  return (
    <>
      {/* Persistent Floating Action Button (FAB) */}
      <button
        type="button"
        id="settlyAiTrigger"
        onClick={() => setIsOpen(!isOpen)}
        className="settly-ai-trigger-fab"
        aria-label="Ask Settly AI Concierge"
        title="Ask Settly AI Concierge"
      >
        <span className="fab-pulse-halo" />
        <div className="fab-inner">
          <span className="fab-logo-plate">
            <Image
              src="/images/logo.png"
              alt="Settly Logo"
              width={24}
              height={24}
              className="fab-logo-img object-contain"
            />
          </span>
          <span className="fab-live-indicator" />
        </div>
        <span className="fab-tooltip">Ask Settly AI Concierge</span>
      </button>

      {/* Backdrop */}
      <div
        className={`settly-overlay-backdrop ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Floating Drawer / Sliding Modal */}
      <div
        id="settlyAiDrawer"
        className={`settly-assistant-overlay ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Settly AI Concierge"
      >
        {/* Header */}
        <div className="overlay-header">
          <div className="overlay-hdr-left">
            <div className="overlay-hdr-badge">
              <Image
                src="/images/logo.png"
                alt="Settly Logo"
                width={22}
                height={22}
                className="hdr-badge-logo"
              />
            </div>
            <div className="overlay-hdr-titles">
              <div className="hdr-assistant-title">Settly AI Concierge</div>
              <div className="hdr-assistant-sub">
                <span className="dot-live" />
                <span>Cadastre Verified · Golden Square Mandate</span>
              </div>
            </div>
          </div>
          <div className="overlay-hdr-actions">
            <Link
              href="/assistant"
              className="overlay-icon-btn"
              title="Expand to dedicated full workspace"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="overlay-icon-btn"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Workspace Banner */}
        <div className="overlay-full-page-banner">
          <span>Need the full workspace?</span>
          <Link href="/assistant">Open Dedicated Assistant &rarr;</Link>
        </div>

        {/* Dual Tabs */}
        <div className="overlay-modes-bar">
          <div className="overlay-pill-group">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`overlay-pill-btn ${activeTab === "chat" ? "active" : ""}`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("agent")}
              className={`overlay-pill-btn ${activeTab === "agent" ? "active" : ""}`}
            >
              Shortlist Agent
            </button>
          </div>
          <span className="overlay-context-tag">Context: Active Advisory</span>
        </div>

        {/* Scrollable Body */}
        <div className="overlay-body">
          {/* Tab 1: Chat Body */}
          {activeTab === "chat" && (
            <>
              {/* User Bubble */}
              <div className="ovl-msg-row user">
                <div className="ovl-user-bubble">
                  Is this Lake View villa title deed fully authenticated, and how does the price compare to the Golden Square baseline?
                </div>
              </div>

              {/* Assistant Response */}
              <div className="ovl-msg-row assistant">
                <div className="ovl-assistant-card">
                  <div className="ovl-msg-header">
                    <div className="ovl-avatar">
                      <Image
                        src="/images/logo.png"
                        alt="Settly"
                        width={18}
                        height={18}
                      />
                    </div>
                    <span className="ovl-meta-author">Settly AI Assistant</span>
                    <span className="ovl-verified-tag">Certified Advisory</span>
                    <span className="ovl-meta-time">14:35 CLT</span>
                  </div>
                  <div className="ovl-assistant-bubble">
                    <p>
                      Yes, this Lake View villa carries a fully authenticated, original title deed free of encumbrances or cadastral overlaps.{" "}
                      <span className="ovl-citation-chip">Deed #LV-8821</span>
                    </p>
                    <p>
                      At <strong>EGP 78,000,000</strong> (720m² BUA on 950m² land), the valuation is <strong>EGP 108,333/m²</strong> — approximately <strong>+3.2%</strong> above the Golden Square baseline, justified by direct unobstructed fairway frontage.{" "}
                      <span className="ovl-citation-chip">Golden Square Index</span>
                    </p>
                  </div>

                  {/* Suggested Action Card */}
                  <div className="ovl-confirmable-card">
                    <div className="ovl-action-header">
                      <span className="ovl-action-tag">Suggested Viewing Action</span>
                      <span className="ovl-action-status">
                        {viewingConfirmed ? "Confirmed ✓" : "Requires confirmation"}
                      </span>
                    </div>
                    <h4 className="ovl-action-title">Private Escorted Viewing: Lake View Villa</h4>
                    <p className="ovl-action-desc">
                      Hosted by licensed broker <strong>Karim El-Mansy (Licence #EG-99120-B)</strong>. Security gate pass issued on acceptance.
                    </p>
                    <div className="ovl-action-specs">
                      <div className="spec-item">
                        <span className="lbl">Date</span>
                        <span className="val">Tomorrow, 14 Sept</span>
                      </div>
                      <div className="spec-item">
                        <span className="lbl">Slot</span>
                        <span className="val">04:30 PM</span>
                      </div>
                      <div className="spec-item">
                        <span className="lbl">Value</span>
                        <span className="val">EGP 78.0M</span>
                      </div>
                    </div>
                    <div className="ovl-action-btn-row">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="btn-ovl-secondary"
                      >
                        Not now
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingConfirmed(true)}
                        className="btn-ovl-primary"
                      >
                        {viewingConfirmed ? "Viewing Confirmed ✓" : "Confirm Viewing Request"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Shortlist Agent */}
          {activeTab === "agent" && (
            <div className="overlay-agent-container">
              <div className="ovl-agent-banner">
                <span className="agent-tag">Autonomous Research Agent</span>
                <div className="agent-title">Curated High-Value Villa Shortlist</div>
                <span className="agent-status-tag">Execution Complete · 642 mandates parsed</span>
              </div>

              <div className="ovl-plan-card">
                <div className="plan-card-hdr">
                  <span>Execution Trace</span>
                  <span>Latency: 1.1s</span>
                </div>
                <div className="plan-steps-list">
                  <div className="plan-step">
                    <span className="step-check">✓</span>
                    <span className="step-txt">Scanned Greater Cairo cadastre</span>
                    <span className="step-val">642 parsed</span>
                  </div>
                  <div className="plan-step">
                    <span className="step-check">✓</span>
                    <span className="step-txt">Filtered 4+ bed villas in budget</span>
                    <span className="step-val">18 eligible</span>
                  </div>
                  <div className="plan-step">
                    <span className="step-check">✓</span>
                    <span className="step-txt">Verified title deeds free of encumbrance</span>
                    <span className="step-val">100% clean</span>
                  </div>
                  <div className="plan-step">
                    <span className="step-check">✓</span>
                    <span className="step-txt">Synthesized top candidate shortlist</span>
                    <span className="step-val">2 matched</span>
                  </div>
                </div>
              </div>

              <div className="ovl-mini-cards-stack">
                <div className="ovl-mini-card">
                  <div className="mini-info">
                    <span className="mini-loc">Mivida · Golden Square</span>
                    <strong className="mini-name">Crescent Lakefront Mansion</strong>
                    <span className="mini-specs">5 beds · 6 baths · 580m²</span>
                    <span className="mini-price">54,000,000 EGP</span>
                    <Link href="/search?keyword=Crescent" className="btn-mini-request">
                      Request Viewing
                    </Link>
                  </div>
                </div>

                <div className="ovl-mini-card">
                  <div className="mini-info">
                    <span className="mini-loc">Katameya Dunes</span>
                    <strong className="mini-name">Fairway 14 Signature Villa</strong>
                    <span className="mini-specs">4 beds · 5 baths · 520m²</span>
                    <span className="mini-price">44,500,000 EGP</span>
                    <Link href="/search?keyword=Katameya" className="btn-mini-request">
                      Request Viewing
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Composer */}
        <div className="overlay-composer">
          <div className="ovl-composer-row">
            <input
              type="text"
              placeholder="Ask about title deeds, price baselines, or request a viewing..."
              className="ovl-composer-input"
            />
            <button type="button" className="ovl-btn-send" aria-label="Send query">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="ovl-composer-disclaimer">
            Settly AI Advisory · Grounded in verified cadastral records · Transacted through licensed brokers.
          </p>
        </div>
      </div>
    </>
  );
}
