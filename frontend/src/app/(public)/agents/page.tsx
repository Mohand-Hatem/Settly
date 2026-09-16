"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Star,
  ShieldCheck,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  X,
  ArrowRight,
} from "lucide-react";
import "@/styles/settly/agents.css";

export interface AdvisorRecord {
  id: string;
  name: string;
  role: string;
  agency: string;
  licenseNumber: string;
  rating: number;
  reviewsCount: number;
  territory: string;
  territoryKey: "all" | "new-cairo" | "west-cairo" | "north-coast" | "red-sea";
  specializations: string[];
  isPartner: boolean;
  careerVolumeEgp: string;
  completedClosings: number;
  avatar: string;
  whatsappNumber: string;
}

const DEFAULT_ADVISORS: AdvisorRecord[] = [
  {
    id: "karim-el-sayed",
    name: "Karim El-Sayed",
    role: "Senior Private Client Partner",
    agency: "Settly Capital Desk · New Cairo",
    licenseNumber: "RE-EG-2024-0891",
    rating: 4.95,
    reviewsCount: 42,
    territory: "Golden Square, New Cairo",
    territoryKey: "new-cairo",
    specializations: ["Lake View Signature", "Villette", "Mivida"],
    isPartner: true,
    careerVolumeEgp: "EGP 1.85B",
    completedClosings: 42,
    avatar: "/images/phone.jpg",
    whatsappNumber: "201000000000",
  },
  {
    id: "nourhan-mansour",
    name: "Nourhan Mansour",
    role: "West Cairo Luxury Director",
    agency: "Prime West Advisory · Sheikh Zayed",
    licenseNumber: "RE-EG-2023-0412",
    rating: 4.92,
    reviewsCount: 36,
    territory: "Sheikh Zayed & New Zayed",
    territoryKey: "west-cairo",
    specializations: ["Allegria Golf", "Karmell", "Cairo Gate"],
    isPartner: true,
    careerVolumeEgp: "EGP 1.42B",
    completedClosings: 36,
    avatar: "/images/2.jpg",
    whatsappNumber: "201000000000",
  },
  {
    id: "tarek-el-gazzar",
    name: "Tarek El-Gazzar",
    role: "Coastal & Sovereign Asset Lead",
    agency: "Mediterranean Desk · Sahel & Ras El Hekma",
    licenseNumber: "RE-EG-2022-0198",
    rating: 4.98,
    reviewsCount: 28,
    territory: "Ras El Hekma & North Coast",
    territoryKey: "north-coast",
    specializations: ["Ras El Hekma Waterfront", "Marassi", "Silversands"],
    isPartner: true,
    careerVolumeEgp: "EGP 2.20B",
    completedClosings: 28,
    avatar: "/images/phone.jpg",
    whatsappNumber: "201000000000",
  },
  {
    id: "laila-el-kady",
    name: "Laila El-Kady",
    role: "Red Sea Waterfront Advisor",
    agency: "Coastal Lagoons Desk · El Gouna",
    licenseNumber: "RE-EG-2024-0615",
    rating: 4.88,
    reviewsCount: 24,
    territory: "El Gouna & Red Sea Coast",
    territoryKey: "red-sea",
    specializations: ["Fanadir Bay", "Ancient Sands", "Abu Tig Marina"],
    isPartner: true,
    careerVolumeEgp: "EGP 950M",
    completedClosings: 24,
    avatar: "/images/2.jpg",
    whatsappNumber: "201000000000",
  },
  {
    id: "sherif-hany",
    name: "Sherif Hany",
    role: "New Capital Sovereign Desk Lead",
    agency: "Institutional Real Estate · New Capital",
    licenseNumber: "RE-EG-2023-0887",
    rating: 4.91,
    reviewsCount: 31,
    territory: "New Administrative Capital & Mostakbal",
    territoryKey: "new-cairo",
    specializations: ["Diplomatic District", "CBD Towers", "HAPTown"],
    isPartner: false,
    careerVolumeEgp: "EGP 1.15B",
    completedClosings: 31,
    avatar: "/images/phone.jpg",
    whatsappNumber: "201000000000",
  },
  {
    id: "dina-farouk",
    name: "Dina Farouk",
    role: "Private Family Office Advisor",
    agency: "Settly Sovereign Wealth Advisory",
    licenseNumber: "RE-EG-2021-0304",
    rating: 4.96,
    reviewsCount: 38,
    territory: "Katameya & Golden Square",
    territoryKey: "new-cairo",
    specializations: ["Katameya Dunes", "Katameya Heights", "SwanLake"],
    isPartner: true,
    careerVolumeEgp: "EGP 1.68B",
    completedClosings: 38,
    avatar: "/images/2.jpg",
    whatsappNumber: "201000000000",
  },
];

export default function AgentDirectoryPage() {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>(DEFAULT_ADVISORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("volume_desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Fetch agents from backend API if available to sync live identities
  useEffect(() => {
    async function loadAgents() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiBase}/api/v1/identity/agents`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.items && data.items.length > 0) {
            // merge with local rich attributes
            setAdvisors((prev) =>
              prev.map((agent, i) => {
                const remote = data.items[i];
                return remote ? { ...agent, id: remote.id || agent.id } : agent;
              })
            );
          }
        }
      } catch {
        // Fallback to rich DEFAULT_ADVISORS
      }
    }
    loadAgents();
  }, []);

  // Filter & Sort Logic
  const filteredAdvisors = useMemo(() => {
    return advisors
      .filter((adv) => {
        const matchesQuery =
          searchQuery.trim() === "" ||
          adv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adv.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adv.territory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adv.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTerritory =
          selectedTerritory === "all" || adv.territoryKey === selectedTerritory;

        return matchesQuery && matchesTerritory;
      })
      .sort((a, b) => {
        if (sortOption === "rating_desc") return b.rating - a.rating;
        if (sortOption === "closings_desc") return b.completedClosings - a.completedClosings;
        return 0; // default volume order
      });
  }, [advisors, searchQuery, selectedTerritory, sortOption]);

  return (
    <div className="agents-page-wrapper">
      {/* 1. Broadsheet Hero */}
      <section className="dir-hero">
        <div className="dir-hero-inner">
          <div className="dir-hero-content">
            <h1>Egypt&apos;s Certified Luxury Real Estate Advisors</h1>
            <p>
              Curated private client desks and accredited brokers with audited transaction track records,
              fiduciary diligence compliance, and direct Tier-1 developer allocations across Greater Cairo
              and the Mediterranean Coast.
            </p>
          </div>

          <div className="dir-telemetry-ribbon">
            <div className="telemetry-item">
              <div className="telemetry-val">
                <span className="telemetry-dot" />
                84 Advisors
              </div>
              <div className="telemetry-lbl">Licensed &amp; Cadastre Audited</div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-val">EGP 14.8B</div>
              <div className="telemetry-lbl">Audited Lifetime Volume</div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-val">100% Licensed</div>
              <div className="telemetry-lbl">Regulatory Compliance</div>
            </div>
            <div className="telemetry-item">
              <div className="telemetry-val">14 Mins</div>
              <div className="telemetry-lbl">Median HNW Response SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Sticky Workbench */}
      <section className="dir-workbench" id="workbench">
        <div className="dir-workbench-inner">
          <div className="workbench-top-row">
            {/* Search Bar */}
            <div className="dir-search-wrap">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by advisor name, brokerage firm, or development partner..."
                className="dir-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="dir-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  style={{ display: "block" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filters & View Toggle */}
            <div className="workbench-filters">
              <select
                className="dir-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                aria-label="Sort advisors"
              >
                <option value="volume_desc">Sort by Lifetime Volume</option>
                <option value="closings_desc">Sort by Completed Closings</option>
                <option value="rating_desc">Sort by Rating Score</option>
              </select>

              <div className="view-mode-toggle" role="group" aria-label="View Mode">
                <button
                  type="button"
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid card view"
                >
                  <LayoutGrid size={15} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Table dossier view"
                >
                  <TableIcon size={15} />
                  <span>Dossier</span>
                </button>
              </div>
            </div>
          </div>

          {/* Territory Pills */}
          <div className="territory-pills-bar" role="group" aria-label="Filter by territory">
            {[
              { id: "all", label: "All Territories", count: 84 },
              { id: "new-cairo", label: "New Cairo (Golden Square)", count: 32 },
              { id: "west-cairo", label: "West Cairo (New Zayed)", count: 24 },
              { id: "north-coast", label: "North Coast (Sahel)", count: 18 },
              { id: "red-sea", label: "Red Sea (El Gouna)", count: 10 },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`territory-pill ${selectedTerritory === t.id ? "active" : ""}`}
                onClick={() => setSelectedTerritory(t.id)}
              >
                <span>{t.label}</span>
                <span className="pill-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Directory Content Body */}
      <main className="dir-body">
        <div className="dir-status-bar">
          <div>
            Showing <strong>{filteredAdvisors.length}</strong> of <strong>84</strong> verified luxury advisors
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                color: "var(--brass-600)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset Search ✕
            </button>
          )}
        </div>

        {/* View Mode: Cards Grid */}
        {viewMode === "grid" && (
          <div className="agents-grid">
            {filteredAdvisors.map((adv) => (
              <article key={adv.id} className="agent-card">
                <div className="agent-media-box">
                  <Image
                    src={adv.avatar}
                    alt={adv.name}
                    fill
                    className="object-cover"
                  />
                  <span className="agent-badge-verified">
                    <ShieldCheck size={12} strokeWidth={2.5} />
                    Verified Advisor
                  </span>
                  <span className="agent-license-tag">{adv.licenseNumber}</span>
                </div>

                <div className="agent-info">
                  <div className="agent-name-row">
                    <Link href={`/agents/${adv.id}`} className="agent-name">
                      {adv.name}
                    </Link>
                    <span className="agent-rating">
                      <Star size={12} fill="#C69749" stroke="#C69749" />
                      {adv.rating}
                    </span>
                  </div>

                  <div className="agent-role">{adv.role}</div>
                  <div className="agent-agency">{adv.agency}</div>

                  <div className="agent-tags">
                    <span className="agent-tag">{adv.territory}</span>
                    {adv.isPartner && (
                      <span className="agent-tag dev-partner">Tier-1 Developer Partner</span>
                    )}
                  </div>

                  <div className="agent-metrics-grid">
                    <div className="metric-cell">
                      <span className="metric-num">{adv.careerVolumeEgp}</span>
                      <span className="metric-label">Career Volume</span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-num">{adv.completedClosings} Units</span>
                      <span className="metric-label">Verified Closings</span>
                    </div>
                  </div>

                  <div className="agent-card-actions">
                    <Link href={`/agents/${adv.id}`} className="btn-agent-primary">
                      <span>View Dossier</span>
                      <ArrowRight size={13} />
                    </Link>
                    <a
                      href={`https://wa.me/${adv.whatsappNumber}?text=Hello%20${encodeURIComponent(
                        adv.name
                      )},%20I%20am%20inquiring%20via%20Settly.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-agent-secondary"
                    >
                      <Phone size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* View Mode: Institutional Table */}
        {viewMode === "table" && (
          <div className="agents-table-wrap">
            <table className="agents-table">
              <thead>
                <tr>
                  <th>Advisor Identity</th>
                  <th>Primary Corridor</th>
                  <th>Regulatory ID</th>
                  <th>Career Volume</th>
                  <th>Audited Closings</th>
                  <th>Rating</th>
                  <th>Direct Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvisors.map((adv) => (
                  <tr key={adv.id}>
                    <td>
                      <div className="table-agent-profile">
                        <div
                          style={{
                            position: "relative",
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          <Image
                            src={adv.avatar}
                            alt={adv.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="table-agent-meta">
                          <Link href={`/agents/${adv.id}`} className="table-agent-name">
                            {adv.name}
                          </Link>
                          <span className="table-agent-sub">{adv.role}</span>
                        </div>
                      </div>
                    </td>
                    <td>{adv.territory}</td>
                    <td style={{ fontFamily: "var(--mono-ui)", fontSize: "11px", color: "var(--ink-3)" }}>
                      {adv.licenseNumber}
                    </td>
                    <td className="table-mono-num">{adv.careerVolumeEgp}</td>
                    <td className="table-mono-num">{adv.completedClosings} Units</td>
                    <td>
                      <span className="agent-rating">
                        <Star size={11} fill="#C69749" stroke="#C69749" />
                        {adv.rating}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/agents/${adv.id}`}
                        style={{
                          fontFamily: "var(--sans-body)",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "var(--brass-600)",
                          textDecoration: "none",
                        }}
                      >
                        Inspect Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* 4. Settly 5-Stage Fiduciary Verification Standard */}
      <section className="fiduciary-standard-section">
        <div className="fiduciary-inner">
          <div className="fiduciary-header">
            <h2>The Settly 5-Stage Fiduciary Verification Standard</h2>
            <p>
              Unlike indiscriminate open directories, every broker represented on Settly undergoes rigorous
              statutory cadastre audits, sovereign Escrow Account certifications, and strict response SLAs.
            </p>
          </div>

          <div className="fiduciary-grid">
            <div className="fiduciary-step">
              <span className="fiduciary-step-num">STAGE 01</span>
              <h3>Regulatory License Audit</h3>
              <p>
                Verification with Egypt&apos;s Ministry of Housing and Egyptian Real Estate Regulatory Authority.
                Active commercial registration and clean disciplinary standing required.
              </p>
            </div>

            <div className="fiduciary-step">
              <span className="fiduciary-step-num">STAGE 02</span>
              <h3>Tier-1 Developer Accreditation</h3>
              <p>
                Confirmed direct allocation quotas with Emaar Misr, Palm Hills, SODIC, Hassan Allam, and Ora.
                Zero unverified sub-brokerage chains.
              </p>
            </div>

            <div className="fiduciary-step">
              <span className="fiduciary-step-num">STAGE 03</span>
              <h3>Deed Cadastre Verification</h3>
              <p>
                Every listing submitted by an advisor is cross-checked against New Urban Communities Authority
                (NUCA) title records before publication.
              </p>
            </div>

            <div className="fiduciary-step">
              <span className="fiduciary-step-num">STAGE 04</span>
              <h3>Escrow Account Mandate</h3>
              <p>
                Mandatory adherence to Central Bank-licensed foreign-currency escrow deposit procedures.
                No un-audited direct cash handling permitted.
              </p>
            </div>

            <div className="fiduciary-step">
              <span className="fiduciary-step-num">STAGE 05</span>
              <h3>15-Minute HNW Response SLA</h3>
              <p>
                Advisors commit to real-time client communication, confidential deed dispatch, and scheduled
                private chauffeured estate tours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pre-Footer Private Advisory Strip */}
      <aside className="pre-ftr-strip">
        <div className="wrap pre-ftr-row">
          <div className="pre-ftr-text">
            <h3>Are You a Licensed Tier-1 Luxury Advisor in Egypt?</h3>
            <p>
              Join Settly&apos;s accredited private client network. Gain institutional mandates, verified high-net-worth
              foreign buyer flows, and direct deposit escrow integration.
            </p>
          </div>
          <div className="pre-ftr-actions">
            <a
              href="https://wa.me/201000000000?text=Hello%20Settly%20Admissions,%20I%20am%20applying%20as%20an%20accredited%20broker."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pre-ftr-wa"
            >
              <Phone size={15} />
              <span>Apply for Accreditation</span>
            </a>
            <a href="tel:+20221298000" className="btn-pre-ftr-call">
              <Phone size={14} />
              <span>+20 (2) 2129 8000</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
