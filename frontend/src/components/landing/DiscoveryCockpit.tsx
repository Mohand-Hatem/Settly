"use client";

import React, { useState } from "react";
import Link from "next/link";

export function DiscoveryCockpit() {
  const [chips, setChips] = useState<{ [key: string]: boolean }>({
    ready: true,
    plan: true,
    pool: false,
    shell: false,
  });

  const [activeRadarPin, setActiveRadarPin] = useState<"p1" | "p2">("p1");

  const toggleChip = (key: string) => {
    setChips((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeCount = Object.values(chips).filter(Boolean).length;
  const verifiedUnits =
    activeCount === 1 ? 184 : activeCount === 2 ? 142 : activeCount === 3 ? 96 : activeCount === 4 ? 48 : 210;

  const marqueeItems = [
    {
      pillClass: "pill-param",
      pillLabel: "Parametric",
      query: "New Cairo · 7-Year Plan · < EGP 48,000/m²",
      result: "142 units",
    },
    {
      pillClass: "pill-sentence",
      pillLabel: "Sentence",
      query: "“Chalet in Marassi or Hacienda with sea view, summer 2026”",
      result: "8 matches",
    },
    {
      pillClass: "pill-map",
      pillLabel: "Map radar",
      query: "Drawn boundary: Golden Square, New Cairo (3.4 km²)",
      result: "68 units",
    },
    {
      pillClass: "pill-sentence",
      pillLabel: "Sentence",
      query: "“4-bed standalone in Villette with garden under 32M”",
      result: "14 matches",
    },
    {
      pillClass: "pill-param",
      pillLabel: "Parametric",
      query: "El Gouna · Seafront · 10% Down · 5-Yr Plan",
      result: "19 units",
    },
    {
      pillClass: "pill-map",
      pillLabel: "Map radar",
      query: "Drawn boundary: New Zayed (Karma 4 / Allegria)",
      result: "37 units",
    },
    {
      pillClass: "pill-sentence",
      pillLabel: "Sentence",
      query: "“Duplex in Badya with solar roof and 10-year instalments”",
      result: "23 matches",
    },
    {
      pillClass: "pill-param",
      pillLabel: "Parametric",
      query: "Ras El Hekma · Q2 2027 Handover · Direct beach",
      result: "29 units",
    },
  ];

  return (
    <section className="sect" id="buy">
      <div className="wrap">
        <div className="shead">
          <h2>Three ways to find it, depending on how you think.</h2>
          <p>
            Some buyers arrive with a spreadsheet. Some arrive with a
            neighbourhood. Some arrive with a sentence. Settly answers all three
            from the same live index.
          </p>
        </div>

        {/* 3 Bespoke Discovery Consoles */}
        <div className="discovery-cockpit">
          {/* Console 1: Parametric (Spreadsheet) */}
          <div className="discovery-console">
            <div className="console-top">
              <div className="console-header-row">
                <span className="console-badge">Parametric</span>
                <div className="console-ico">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                    <circle cx="8" cy="6" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="12" r="2.2" fill="currentColor" stroke="none" />
                    <circle cx="10" cy="18" r="2.2" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              </div>
              <h3>Filter on precise criteria</h3>
              <p>
                Narrow by handover quarter, developer track record, instalment
                length, and exact price per square metre.
              </p>
            </div>
            <div className="console-ui">
              <div className="param-bracket">
                <span>PRICE PER SQM</span>
                <span className="param-bracket-val" id="paramPriceReadout">
                  EGP 38k — 52k / m²
                </span>
              </div>
              <div className="param-slider-track">
                <div className="param-slider-fill" />
                <div
                  className="param-slider-thumb"
                  style={{ insetInlineStart: "18%" }}
                />
                <div
                  className="param-slider-thumb"
                  style={{ insetInlineStart: "78%" }}
                />
              </div>
              <div className="param-chips">
                <span
                  className={`param-chip ${chips.ready ? "active" : ""}`}
                  onClick={() => toggleChip("ready")}
                  style={{ cursor: "pointer" }}
                >
                  {chips.ready && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  Ready to move
                </span>
                <span
                  className={`param-chip ${chips.plan ? "active" : ""}`}
                  onClick={() => toggleChip("plan")}
                  style={{ cursor: "pointer" }}
                >
                  {chips.plan && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  7+ Yr plan
                </span>
                <span
                  className={`param-chip ${chips.pool ? "active" : ""}`}
                  onClick={() => toggleChip("pool")}
                  style={{ cursor: "pointer" }}
                >
                  {chips.pool && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  + Pool
                </span>
                <span
                  className={`param-chip ${chips.shell ? "active" : ""}`}
                  onClick={() => toggleChip("shell")}
                  style={{ cursor: "pointer" }}
                >
                  {chips.shell && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  + Core &amp; shell
                </span>
              </div>
              <div className="console-tally-bar">
                <span>INDEXED COMPOUNDS</span>
                <span className="console-tally-count" id="paramTallyCount">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  {verifiedUnits} verified units
                </span>
              </div>
            </div>
          </div>

          {/* Console 2: Radar Map (Neighbourhood) */}
          <div className="discovery-console">
            <div className="console-top">
              <div className="console-header-row">
                <span className="console-badge">Spatial Map</span>
                <div className="console-ico">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 4-6 2.5v13L9 17l6 3 6-2.5v-13L15 7z" />
                    <path d="M9 4v13M15 7v13" />
                  </svg>
                </div>
              </div>
              <h3>Explore on the terrain</h3>
              <p>
                Pan compound by compound across Cairo and the coast. Draw a
                custom polygon boundary to isolate units in your exact zone.
              </p>
            </div>
            <div className="console-ui">
              <div className="radar-viewport">
                <div className="radar-grid" />
                <div className="radar-road r1" />
                <div className="radar-road r2" />
                <div className="radar-poly" />
                <div
                  className={`radar-pin p1 ${activeRadarPin === "p1" ? "active" : ""}`}
                  title="Mivida Compound"
                  onMouseEnter={() => setActiveRadarPin("p1")}
                >
                  Mivida · 52k/m²
                </div>
                <div
                  className={`radar-pin p2 ${activeRadarPin === "p2" ? "active" : ""}`}
                  title="Villette by Sodic"
                  onMouseEnter={() => setActiveRadarPin("p2")}
                >
                  Villette · 46k/m²
                </div>
                <div className="radar-coords">
                  30°01&apos;N 31°29&apos;E · Golden Square
                </div>
              </div>
              <div className="console-tally-bar">
                <span>POLYGON BOUNDARY</span>
                <span className="console-tally-count">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  3.4 km² · 48 units inside
                </span>
              </div>
            </div>
          </div>

          {/* Console 3: Sentence (Natural Language Intent) */}
          <div className="discovery-console">
            <div className="console-top">
              <div className="console-header-row">
                <span className="console-badge">Natural Language</span>
                <div className="console-ico">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
                    <path d="M18.5 15.5 19 17l1.5.5L19 18l-.5 1.5L18 18l-1.5-.5L18 17z" />
                  </svg>
                </div>
              </div>
              <h3>Describe it in a sentence</h3>
              <p>
                Write what you want the way you would say it out loud. Settly
                parses intent, isolates constraints, and matches real inventory.
              </p>
            </div>
            <div className="console-ui">
              <div className="sentence-prompt-box">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <div className="sentence-text">
                  “4-bed villa with a garden in Tagamoa, ready this year”
                  <span className="sentence-cursor" />
                </div>
              </div>
              <div className="intent-tags">
                <span className="intent-tag">Location: Tagamoa</span>
                <span className="intent-tag">Beds: 4</span>
                <span className="intent-tag">Handover: 2026</span>
                <span className="intent-tag">Garden: Yes</span>
              </div>
              <div className="console-tally-bar">
                <span>INTENT PARSER</span>
                <span className="console-tally-count">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  98% confidence · 14 matches
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Infinite Live Search Ticker */}
        <div
          className="fast-marquee-wrapper"
          aria-label="Live search stream across Egypt"
        >
          <div className="fast-marquee-track">
            {/* Set A */}
            {marqueeItems.map((item, idx) => (
              <Link key={`a-${idx}`} href="/search" className="marquee-card">
                <span className={`marquee-mode-pill ${item.pillClass}`}>
                  {item.pillLabel}
                </span>
                <span className="marquee-query">{item.query}</span>
                <span className="marquee-result">{item.result}</span>
              </Link>
            ))}

            {/* Set B (duplicate for continuous seamless infinite loop) */}
            {marqueeItems.map((item, idx) => (
              <Link
                key={`b-${idx}`}
                href="/search"
                className="marquee-card"
                aria-hidden="true"
                tabIndex={-1}
              >
                <span className={`marquee-mode-pill ${item.pillClass}`}>
                  {item.pillLabel}
                </span>
                <span className="marquee-query">{item.query}</span>
                <span className="marquee-result">{item.result}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
