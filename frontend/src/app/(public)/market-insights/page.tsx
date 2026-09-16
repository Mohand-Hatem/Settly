"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileDown,
  Phone,
  Check,
  X,
} from "lucide-react";
import "@/styles/settly/insights.css";

// Econometric Chart Multi-Series Datasets
interface TimeframeDataset {
  labels: string[];
  goldensq: number[];
  sahel: number[];
  zayed: number[];
  gouna: number[];
}

const CHART_DATASETS: Record<"6M" | "1Y" | "3Y" | "5Y", TimeframeDataset> = {
  "5Y": {
    labels: ["Q1 22", "Q3 22", "Q1 23", "Q3 23", "Q1 24", "Q3 24", "Q1 25", "Q3 25", "Q1 26"],
    goldensq: [26400, 31000, 36500, 42000, 47500, 53000, 59500, 64000, 68500],
    sahel: [21000, 25500, 32000, 39000, 48000, 63000, 82000, 98000, 112000],
    zayed: [24000, 27500, 31800, 36000, 41200, 46000, 50800, 53500, 56200],
    gouna: [38000, 44000, 52000, 61000, 71000, 81000, 91000, 99000, 105000],
  },
  "3Y": {
    labels: ["Q1 23", "Q3 23", "Q1 24", "Q3 24", "Q1 25", "Q3 25", "Q1 26"],
    goldensq: [36500, 42000, 47500, 53000, 59500, 64000, 68500],
    sahel: [32000, 39000, 48000, 63000, 82000, 98000, 112000],
    zayed: [31800, 36000, 41200, 46000, 50800, 53500, 56200],
    gouna: [52000, 61000, 71000, 81000, 91000, 99000, 105000],
  },
  "1Y": {
    labels: ["Q1 25", "Q2 25", "Q3 25", "Q4 25", "Q1 26"],
    goldensq: [59500, 61800, 64000, 66200, 68500],
    sahel: [82000, 90000, 98000, 105000, 112000],
    zayed: [50800, 52100, 53500, 54900, 56200],
    gouna: [91000, 95000, 99000, 102000, 105000],
  },
  "6M": {
    labels: ["Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26", "Mar 26"],
    goldensq: [64800, 65600, 66400, 67200, 67900, 68500],
    sahel: [100000, 102500, 105000, 107500, 110000, 112000],
    zayed: [53800, 54400, 55000, 55400, 55800, 56200],
    gouna: [100000, 101200, 102500, 103500, 104200, 105000],
  },
};

const SERIES_META = [
  { key: "goldensq" as const, name: "Golden Square (New Cairo)", stroke: "#C69749", grad: "grad-goldensq", colorClass: "circle-gold" },
  { key: "sahel" as const, name: "Ras El Hekma (Sahel)", stroke: "#3D5A4C", grad: "grad-sahel", colorClass: "circle-sahel" },
  { key: "zayed" as const, name: "Karmell & New Zayed", stroke: "#1E2A4A", grad: "grad-zayed", colorClass: "circle-zayed" },
  { key: "gouna" as const, name: "El Gouna Waterfront", stroke: "#64748B", grad: "grad-gouna", colorClass: "circle-gouna" },
];

// Yield Arbitrage Constants
const FX_RATES = {
  EGP: { rate: 1.0, prefix: "EGP " },
  USD: { rate: 48.85, prefix: "$" },
  AED: { rate: 13.30, prefix: "AED " },
};

const CORRIDOR_YIELDS = {
  goldensq: { name: "Golden Square, New Cairo", yieldRate: 0.092, cashDiscount: 0.24 },
  sahel: { name: "Ras El Hekma / Sahel", yieldRate: 0.142, cashDiscount: 0.28 },
  zayed: { name: "Karmell & New Zayed", yieldRate: 0.086, cashDiscount: 0.22 },
  gouna: { name: "El Gouna Lagoon Estates", yieldRate: 0.115, cashDiscount: 0.26 },
};

// Developer League Table Data
interface DeveloperRow {
  id: string;
  name: string;
  egxTag: string;
  monogram: string;
  region: "east" | "west" | "coastal" | "all";
  regionTags: string[];
  landBank: string;
  deliveredUnits: string;
  punctualityPct: number;
  trackRecord: string;
  csat: string;
  communities: string;
}

const DEVELOPER_LEAGUE: DeveloperRow[] = [
  {
    id: "emaar",
    name: "Emaar Misr",
    egxTag: "EGX: EMFD · Founded 1997",
    monogram: "EM",
    region: "all",
    regionTags: ["east", "coastal"],
    landBank: "18.2M m²",
    deliveredUnits: "4,200 Units",
    punctualityPct: 98.2,
    trackRecord: "AAA · Tier 1",
    csat: "96% CSAT",
    communities: "Golden Square, Marassi, Uptown",
  },
  {
    id: "palmhills",
    name: "Palm Hills Developments",
    egxTag: "EGX: PHDC · Founded 1997",
    monogram: "PH",
    region: "all",
    regionTags: ["east", "west", "coastal"],
    landBank: "27.5M m²",
    deliveredUnits: "6,850 Units",
    punctualityPct: 94.6,
    trackRecord: "AAA · Tier 1",
    csat: "93% CSAT",
    communities: "Lake View, Badya, Hacienda",
  },
  {
    id: "sodic",
    name: "SODIC Real Estate",
    egxTag: "EGX: OCDI · Founded 1996",
    monogram: "SO",
    region: "all",
    regionTags: ["east", "west", "coastal"],
    landBank: "16.0M m²",
    deliveredUnits: "5,120 Units",
    punctualityPct: 96.4,
    trackRecord: "AAA · Tier 1",
    csat: "95% CSAT",
    communities: "Villette, Karmell, June Sahel",
  },
  {
    id: "ora",
    name: "Ora Developers",
    egxTag: "Private Consortium · Founded 2016",
    monogram: "OR",
    region: "all",
    regionTags: ["east", "west", "coastal"],
    landBank: "11.4M m²",
    deliveredUnits: "1,840 Units",
    punctualityPct: 91.8,
    trackRecord: "AA+ · Tier 1",
    csat: "92% CSAT",
    communities: "ZED Zayed, ZED East, Silversands",
  },
  {
    id: "katameya",
    name: "Katameya Group",
    egxTag: "Private Luxury · Founded 1998",
    monogram: "KD",
    region: "east",
    regionTags: ["east"],
    landBank: "4.8M m²",
    deliveredUnits: "950 Units",
    punctualityPct: 97.1,
    trackRecord: "AAA · Tier 1",
    csat: "97% CSAT",
    communities: "Katameya Dunes, Heights, Creeks",
  },
  {
    id: "hassanallam",
    name: "Hassan Allam Properties",
    egxTag: "Holding Group · Founded 1936",
    monogram: "HA",
    region: "all",
    regionTags: ["east", "coastal"],
    landBank: "14.2M m²",
    deliveredUnits: "3,420 Units",
    punctualityPct: 95.5,
    trackRecord: "AAA · Tier 1",
    csat: "94% CSAT",
    communities: "SwanLake, HAPTown, Little Venice",
  },
];

export default function MarketInsightsPage() {
  // Econometric Chart States
  const [activeTimeframe, setActiveTimeframe] = useState<"6M" | "1Y" | "3Y" | "5Y">("5Y");
  const [activeCorridors, setActiveCorridors] = useState<Record<string, boolean>>({
    goldensq: true,
    sahel: true,
    zayed: true,
    gouna: true,
  });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseCoordX, setMouseCoordX] = useState<number | null>(null);

  // Yield Terminal States
  const [budgetEgp, setBudgetEgp] = useState<number>(32500000);
  const [selectedCurrency, setSelectedCurrency] = useState<"EGP" | "USD" | "AED">("EGP");
  const [selectedCorridorKey, setSelectedCorridorKey] = useState<keyof typeof CORRIDOR_YIELDS>("goldensq");

  // League Table Filter
  const [tableFilter, setTableFilter] = useState<string>("all");

  // Research Dossier Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Q1 2026 Complete Macro Dossier");
  const [modalSub, setModalSub] = useState("42 Pages · Institutional PDF");
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch live market pulse telemetry if backend is available
  useEffect(() => {
    async function loadMarketPulse() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiBase}/api/v1/analytics/market-pulse`);
        if (res.ok) {
          await res.json();
          // live market pulse data can enrich components
        }
      } catch {
        // graceful offline fallback
      }
    }
    loadMarketPulse();
  }, []);

  // Chart coordinate calculations
  const currentDataset = CHART_DATASETS[activeTimeframe];
  const xMin = 60;
  const xMax = 980;
  const yMinVal = 20000;
  const yMaxVal = 120000;
  const yMinY = 300;
  const yMaxY = 40;

  const stepX = (xMax - xMin) / (currentDataset.labels.length - 1);

  // Generate SVG paths for each corridor
  const seriesPaths = useMemo(() => {
    return SERIES_META.map((meta) => {
      const vals = currentDataset[meta.key];
      const points = vals.map((v, idx) => {
        const x = xMin + idx * stepX;
        const normY = (v - yMinVal) / (yMaxVal - yMinVal);
        const y = yMinY - normY * (yMinY - yMaxY);
        return { x, y, v };
      });

      // Monotone cubic bezier path
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
        const cpY1 = p0.y;
        const cpX2 = p1.x - (p1.x - p0.x) * 0.45;
        const cpY2 = p1.y;
        d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }

      const areaD = `${d} L ${points[points.length - 1].x} ${yMinY} L ${points[0].x} ${yMinY} Z`;

      return {
        ...meta,
        linePath: d,
        areaPath: areaD,
        points,
      };
    });
  }, [currentDataset, stepX]);

  // Handle Chart Mouse Move
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const svgWidth = rect.width;
    const svgX = (relX / svgWidth) * 1000;

    if (svgX >= 55 && svgX <= 985) {
      let closestIdx = Math.round((svgX - xMin) / stepX);
      closestIdx = Math.max(0, Math.min(currentDataset.labels.length - 1, closestIdx));
      const snappedX = xMin + closestIdx * stepX;
      setHoverIndex(closestIdx);
      setMouseCoordX(snappedX);
    } else {
      setHoverIndex(null);
      setMouseCoordX(null);
    }
  };

  const handleSvgMouseLeave = () => {
    setHoverIndex(null);
    setMouseCoordX(null);
  };

  // Yield Terminal calculations
  const corridorData = CORRIDOR_YIELDS[selectedCorridorKey];
  const fx = FX_RATES[selectedCurrency];

  // Option A: Primary 8-Yr Launch
  const downPaymentEgp = budgetEgp * 0.1;
  const quarterlyOutlayEgp = (budgetEgp * 0.9) / 32;

  // Option B: Resale Cash Arbitrage
  const grossRentEgp = budgetEgp * corridorData.yieldRate;
  const cashDiscountEgp = budgetEgp * corridorData.cashDiscount;
  const paybackYears = (budgetEgp / grossRentEgp).toFixed(1);

  // Filtered Developer Table
  const filteredDevelopers = DEVELOPER_LEAGUE.filter((dev) => {
    if (tableFilter === "all") return true;
    return dev.regionTags.includes(tableFilter);
  });

  const openDossierModal = (title: string, sub: string) => {
    setModalTitle(title);
    setModalSub(sub);
    setEmailSubmitted(false);
    setModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSubmitted(true);
    setTimeout(() => {
      setModalOpen(false);
      setEmailSubmitted(false);
    }, 2200);
  };

  return (
    <div className="insights-page-wrapper">
      {/* Live Econometric Telemetry Marquee */}
      <div className="mi-ticker-bar" title="Live Econometric Telemetry — Hover to pause stream">
        <div className="mi-marquee-wrapper">
          <div className="mi-marquee-track">
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">CREI-30 Index</span>
              <span className="mi-ticker-bright">1,482.4 pts</span>
              <span className="mi-ticker-gain">▲ +3.2% MoM</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Golden Square Median</span>
              <span className="mi-ticker-bright">68,500 EGP/m²</span>
              <span className="mi-ticker-gain">▲ +44.2% YoY</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Ras El Hekma Prime</span>
              <span className="mi-ticker-bright">112,000 EGP/m²</span>
              <span className="mi-ticker-gain">▲ +78.5% YoY</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Prime Gross Yield</span>
              <span className="mi-ticker-bright">9.4% Median</span>
              <span style={{ color: "var(--brass-200)", fontWeight: 700 }}>● Sovereign Benchmark</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Q1 Capital Volume</span>
              <span className="mi-ticker-bright">EGP 48.2B</span>
              <span className="mi-ticker-gain">▲ +21.4% QoQ</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Delivery Track Record</span>
              <span className="mi-ticker-bright">100% Audited</span>
              <span className="mi-ticker-gain">NUCA Verified</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">USD / EGP Sovereign</span>
              <span className="mi-ticker-bright">48.85</span>
              <span style={{ color: "#94A3B8" }}>Central Bank of Egypt</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">New Zayed Prime</span>
              <span className="mi-ticker-bright">56,200 EGP/m²</span>
              <span className="mi-ticker-gain">▲ +38.6% YoY</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">El Gouna Waterfront</span>
              <span className="mi-ticker-bright">105,000 EGP/m²</span>
              <span className="mi-ticker-gain">▲ +41.0% YoY</span>
            </div>
            {/* Duplicate for infinite loop */}
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">CREI-30 Index</span>
              <span className="mi-ticker-bright">1,482.4 pts</span>
              <span className="mi-ticker-gain">▲ +3.2% MoM</span>
            </div>
            <span className="mi-ticker-sep">/</span>
            <div className="mi-ticker-group">
              <span className="mi-ticker-dim">Golden Square Median</span>
              <span className="mi-ticker-bright">68,500 EGP/m²</span>
              <span className="mi-ticker-gain">▲ +44.2% YoY</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Atmospheric Architectural Hero & Executive Telemetry Cockpit */}
      <section className="mi-hero-panoramic">
        <Image
          src="/images/hero.jpg"
          alt="Cairo Prime Real Estate Landscape"
          fill
          priority
          className="mi-hero-backdrop object-cover"
        />
        <div className="mi-hero-scrim" />

        <div className="wrap mi-hero-content">
          <div>
            <div className="mi-hero-breadcrumbs">
              <Link href="/">Settly Exchange</Link>
              <span>/</span>
              <span>Market Intelligence</span>
              <span>/</span>
              <span style={{ color: "#fff" }}>Q1 2026 Sovereign &amp; Private Capital Report</span>
            </div>
            <h1 className="mi-hero-headline">
              Egypt Luxury Real Estate Macro Intelligence &amp; Capital Flow
            </h1>
            <p className="mi-hero-standfirst">
              Audited transaction telemetry analyzing price per square meter trajectories, master
              developer handover punctuality, primary vs. resale yield arbitrage, and sovereign foreign
              capital allocations across Greater Cairo and the Mediterranean Coast.
            </p>
            <div className="mi-hero-actions">
              <button
                type="button"
                onClick={() =>
                  openDossierModal(
                    "Q1 2026 Complete Macro Dossier",
                    "42 Pages · Full Institutional PDF Report"
                  )
                }
                className="btn-hero-primary"
              >
                <FileDown size={16} />
                <span>Download Executive Dossier (42 Pages)</span>
              </button>
              <a href="#econometricModel" className="btn-hero-secondary">
                <span>Explore Econometric Curves ↓</span>
              </a>
            </div>
          </div>

          {/* Executive Telemetry Cockpit (Right Plate) */}
          <div className="mi-hero-cockpit">
            <div className="cockpit-hdr">
              <span className="cockpit-title">Executive Telemetry Deck</span>
              <span className="cockpit-badge">Q1 2026 Audited</span>
            </div>
            <div className="cockpit-metrics-stack">
              <div className="cockpit-row">
                <div className="cockpit-label">
                  <strong>Ras El Hekma Sovereign Horizon</strong>
                  <span>Frontline beachfront valuation surge</span>
                </div>
                <div className="cockpit-val-box">
                  <div className="cockpit-val-num">+62.4%</div>
                  <div className="cockpit-val-sub">12-Mo Appreciation</div>
                </div>
              </div>

              <div className="cockpit-row">
                <div className="cockpit-label">
                  <strong>Golden Square Liquidity Velocity</strong>
                  <span>New Cairo median transaction speed</span>
                </div>
                <div className="cockpit-val-box">
                  <div className="cockpit-val-num">44 Days</div>
                  <div className="cockpit-val-sub">142 Audited Units</div>
                </div>
              </div>

              <div className="cockpit-row">
                <div className="cockpit-label">
                  <strong>Primary Launch Premium Spread</strong>
                  <span>Off-plan 8-year plan vs cash resale</span>
                </div>
                <div className="cockpit-val-box">
                  <div className="cockpit-val-num">+18.4%</div>
                  <div className="cockpit-val-sub">0% Interest Leverage</div>
                </div>
              </div>

              <div className="cockpit-row">
                <div className="cockpit-label">
                  <strong>Foreign Capital Allocation</strong>
                  <span>Regional &amp; Expatriate Investment Inflows</span>
                </div>
                <div className="cockpit-val-box">
                  <div className="cockpit-val-num">$4.2B USD</div>
                  <div className="cockpit-val-sub">58% USD Contracts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial Memo & Macro Signals Grid */}
      <section className="mi-broadsheet-strip">
        <div className="wrap mi-memo-layout">
          {/* Lead Economist Column */}
          <div className="mi-economist-memo">
            <div className="memo-author-strip">
              <div
                style={{
                  position: "relative",
                  width: "46px",
                  height: "46px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid var(--line-2)",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/images/2.jpg"
                  alt="Dr. Hisham El-Gazzar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="memo-meta">
                <span className="memo-name">Dr. Hisham El-Gazzar</span>
                <span className="memo-role">
                  Chief Economist &amp; Head of Sovereign Advisory · Settly Research
                </span>
              </div>
            </div>

            <h2 className="memo-headline">
              The Structural Re-Pricing of Egypt&apos;s Premier Living Assets
            </h2>

            <div className="memo-prose">
              <p>
                The first quarter of 2026 marks an unprecedented bifurcation in Egypt&apos;s residential
                property landscape. The injection of the $35 billion Ras El Hekma foreign direct investment
                agreement, paired with the Central Bank of Egypt&apos;s foreign-exchange stabilization framework,
                has permanently separated commodity residential stock from prime sovereign real estate assets.
              </p>
              <p>
                Capital allocators are no longer evaluating acquisitions purely through the lens of local
                inflationary hedges. Instead, institutional capital and GCC private family offices are treating
                verified master-planned compounds in New Cairo&apos;s Golden Square and the Mediterranean
                shoreline as sovereign dollar-indexed stores of value.
              </p>
              <div className="memo-quote">
                &ldquo;Developers offering 8-year payment plans at 0% nominal interest are effectively
                subsidizing buyer balance sheets against macroeconomic currency adjustments.&rdquo;
              </div>
              <p>
                For liquid buyers with offshore currency reserves, immediate-handover resale properties offer an
                extraordinary 22% to 28% cash-discount arbitrage compared to primary off-plan launches. We
                anticipate this yield spread will narrow significantly through the final delivery cycles of 2026.
              </p>
            </div>
          </div>

          {/* Macro Signals Rail */}
          <div className="mi-signals-rail">
            <div className="signals-rail-hdr">
              <span>Market Conviction Matrix</span>
              <span>Q1 Benchmark</span>
            </div>

            <div className="signal-item">
              <div className="signal-row-top">
                <span className="signal-corridor">New Cairo (Golden Square)</span>
                <span className="signal-badge-val">68,500 EGP/m²</span>
              </div>
              <div className="signal-subtext">
                High liquidity corridor. 142 audited units currently traded with average absorption cycle
                of 44 days. Palm Hills and Emaar maintain strongest secondary pricing.
              </div>
            </div>

            <div className="signal-item">
              <div className="signal-row-top">
                <span className="signal-corridor">Ras El Hekma Bay (Sahel)</span>
                <span className="signal-badge-val">112,000 EGP/m²</span>
              </div>
              <div className="signal-subtext">
                Exponential growth trajectory (+78.5% YoY). Transition from seasonal summer retreat to
                12-month sovereign Mediterranean Riviera driving unprecedented Gulf allocations.
              </div>
            </div>

            <div className="signal-item">
              <div className="signal-row-top">
                <span className="signal-corridor">West Cairo (Karmell &amp; Zayed)</span>
                <span className="signal-badge-val">56,200 EGP/m²</span>
              </div>
              <div className="signal-subtext">
                Steady capital compounding (+38.6% YoY). Sphinx Airport operations and New Zayed master
                infrastructure driving strong corporate executive relocations.
              </div>
            </div>

            <div className="signal-item">
              <div className="signal-row-top">
                <span className="signal-corridor">El Gouna Lagoon Estates</span>
                <span className="signal-badge-val">105,000 EGP/m²</span>
              </div>
              <div className="signal-subtext">
                Highest EUR/USD rental yield in Egypt (11.5% net). 100% freehold foreign ownership with
                instant European residency eligibility.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Econometric Time-Series Appreciation Chart */}
      <section className="mi-chart-section" id="econometricModel">
        <div className="wrap">
          <div className="mi-section-head">
            <h2 className="mi-section-h2">Historical Capital Trajectory (2022 — 2026)</h2>
            <p className="mi-section-lead">
              Verified transaction benchmark prices per square meter (BUA) across Egypt&apos;s 4 premier
              luxury investment corridors. Toggle corridors or timeframes to inspect comparative CAGR curves.
            </p>
          </div>

          <div className="chart-workbench">
            {/* Header & Timeframe Switches */}
            <div className="chart-card-header">
              <div className="chart-card-meta">
                <div className="chart-card-title">Corridor Valuation Curves (EGP/m² BUA)</div>
                <div className="chart-card-desc">
                  Audited quarterly transaction benchmarks · Monotone spline interpolation
                </div>
              </div>
              <div className="timeframe-group" role="group" aria-label="Timeframe selector">
                {(["6M", "1Y", "3Y", "5Y"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`tf-btn ${activeTimeframe === tf ? "active" : ""}`}
                    onClick={() => setActiveTimeframe(tf)}
                  >
                    {tf === "5Y" ? "5Y (Full)" : tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend & Toggles */}
            <div className="chart-actions-toolbar">
              <div className="corridor-legend-group">
                {SERIES_META.map((meta) => {
                  const isActive = activeCorridors[meta.key];
                  return (
                    <button
                      key={meta.key}
                      type="button"
                      className={`legend-pill ${!isActive ? "inactive" : ""}`}
                      onClick={() =>
                        setActiveCorridors((prev) => ({ ...prev, [meta.key]: !prev[meta.key] }))
                      }
                    >
                      <span className={`legend-circle ${meta.colorClass}`} />
                      <span>{meta.name}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontFamily: "var(--mono-ui)", fontSize: "11px", color: "var(--ink-3)" }}>
                Source: REID Audited Land Registry
              </div>
            </div>

            {/* SVG Canvas with Interactive Scrubber */}
            <div className="svg-canvas-container">
              <svg
                ref={svgRef}
                viewBox="0 0 1000 360"
                preserveAspectRatio="none"
                onMouseMove={handleSvgMouseMove}
                onMouseLeave={handleSvgMouseLeave}
              >
                <defs>
                  <linearGradient id="grad-goldensq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C69749" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#C69749" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="grad-sahel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3D5A4C" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#3D5A4C" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="grad-zayed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E2A4A" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#1E2A4A" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="grad-gouna" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#64748B" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#64748B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <g stroke="rgba(0, 0, 0, 0.06)" strokeWidth="1" strokeDasharray="3,3">
                  <line x1="60" y1="40" x2="980" y2="40" />
                  <line x1="60" y1="105" x2="980" y2="105" />
                  <line x1="60" y1="170" x2="980" y2="170" />
                  <line x1="60" y1="235" x2="980" y2="235" />
                  <line x1="60" y1="300" x2="980" y2="300" />
                </g>

                {/* Y-Axis Labels */}
                <g fill="#94A3B8" fontFamily="var(--mono-ui)" fontSize="11" textAnchor="end">
                  <text x="50" y="44">120k</text>
                  <text x="50" y="109">95k</text>
                  <text x="50" y="174">70k</text>
                  <text x="50" y="239">45k</text>
                  <text x="50" y="304">20k</text>
                </g>

                {/* X-Axis Labels */}
                <g fill="#94A3B8" fontFamily="var(--mono-ui)" fontSize="11" textAnchor="middle">
                  {currentDataset.labels.map((lbl, idx) => (
                    <text key={idx} x={xMin + idx * stepX} y="325">
                      {lbl}
                    </text>
                  ))}
                </g>

                {/* Render Series Areas and Lines */}
                {seriesPaths.map((series) => {
                  if (!activeCorridors[series.key]) return null;
                  return (
                    <g key={series.key}>
                      <path d={series.areaPath} fill={`url(#${series.grad})`} />
                      <path
                        d={series.linePath}
                        fill="none"
                        stroke={series.stroke}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}

                {/* Crosshair Line */}
                {mouseCoordX !== null && (
                  <line
                    x1={mouseCoordX}
                    y1="30"
                    x2={mouseCoordX}
                    y2="310"
                    stroke="rgba(30, 42, 74, 0.45)"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Snap Dots on Intersects */}
                {hoverIndex !== null &&
                  mouseCoordX !== null &&
                  seriesPaths.map((series) => {
                    if (!activeCorridors[series.key]) return null;
                    const pt = series.points[hoverIndex];
                    if (!pt) return null;
                    return (
                      <circle
                        key={series.key}
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#fff"
                        stroke={series.stroke}
                        strokeWidth="2"
                      />
                    );
                  })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoverIndex !== null && (
                <div className="chart-hover-overlay">
                  <div className="chart-hover-head">
                    <span>{currentDataset.labels[hoverIndex]}</span>
                    <span style={{ color: "#94A3B8", fontWeight: "normal", textTransform: "none" }}>
                      BUA benchmark
                    </span>
                  </div>
                  <div className="chart-hover-rows-box">
                    {activeCorridors.goldensq && (
                      <div className="chart-hover-row">
                        <div className="chart-hover-label-group">
                          <span className="chart-hover-swatch" style={{ background: "#C69749" }} />
                          <span>Golden Square</span>
                        </div>
                        <span className="chart-hover-val">
                          {currentDataset.goldensq[hoverIndex].toLocaleString()} EGP/m²
                        </span>
                      </div>
                    )}
                    {activeCorridors.sahel && (
                      <div className="chart-hover-row">
                        <div className="chart-hover-label-group">
                          <span className="chart-hover-swatch" style={{ background: "#3D5A4C" }} />
                          <span>Ras El Hekma</span>
                        </div>
                        <span className="chart-hover-val">
                          {currentDataset.sahel[hoverIndex].toLocaleString()} EGP/m²
                        </span>
                      </div>
                    )}
                    {activeCorridors.zayed && (
                      <div className="chart-hover-row">
                        <div className="chart-hover-label-group">
                          <span className="chart-hover-swatch" style={{ background: "#1E2A4A" }} />
                          <span>New Zayed</span>
                        </div>
                        <span className="chart-hover-val">
                          {currentDataset.zayed[hoverIndex].toLocaleString()} EGP/m²
                        </span>
                      </div>
                    )}
                    {activeCorridors.gouna && (
                      <div className="chart-hover-row">
                        <div className="chart-hover-label-group">
                          <span className="chart-hover-swatch" style={{ background: "#64748B" }} />
                          <span>El Gouna</span>
                        </div>
                        <span className="chart-hover-val">
                          {currentDataset.gouna[hoverIndex].toLocaleString()} EGP/m²
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Statistics Strip */}
            <div className="chart-summary-strip">
              <div className="chart-sum-col">
                <span className="chart-sum-title">Golden Square</span>
                <span className="chart-sum-price">68,500 EGP/m²</span>
                <span className="chart-sum-delta">+44.2% YoY · 3Y CAGR +31.8%</span>
              </div>
              <div className="chart-sum-col">
                <span className="chart-sum-title">Ras El Hekma</span>
                <span className="chart-sum-price">112,000 EGP/m²</span>
                <span className="chart-sum-delta">+78.5% YoY · 3Y CAGR +48.1%</span>
              </div>
              <div className="chart-sum-col">
                <span className="chart-sum-title">Karmell &amp; Zayed</span>
                <span className="chart-sum-price">56,200 EGP/m²</span>
                <span className="chart-sum-delta">+38.6% YoY · 3Y CAGR +26.4%</span>
              </div>
              <div className="chart-sum-col">
                <span className="chart-sum-title">El Gouna Estates</span>
                <span className="chart-sum-price">105,000 EGP/m²</span>
                <span className="chart-sum-delta">+41.0% YoY · 3Y CAGR +34.2%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Institutional Yield Arbitrage Terminal */}
      <section className="mi-chart-section" id="yieldArbitrage">
        <div className="wrap">
          <div className="mi-section-head">
            <h2 className="mi-section-h2">Primary Launch vs. Resale Yield Arbitrage</h2>
            <p className="mi-section-lead">
              Evaluate capital efficiency: 8-year developer installment schedules (0% interest leverage)
              versus immediate-handover resale properties with active gross rental cash flows.
            </p>
          </div>

          <div className="yield-terminal-box">
            {/* Terminal Controls */}
            <div className="terminal-controls-col">
              <div className="term-control-block">
                <span className="term-control-title">Target Capital Allocation</span>
                <div className="term-stepped-pills">
                  {[20000000, 32500000, 50000000, 75000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`step-pill ${budgetEgp === amt ? "active" : ""}`}
                      onClick={() => setBudgetEgp(amt)}
                    >
                      {amt / 1000000}M
                    </button>
                  ))}
                </div>
              </div>

              <div className="term-control-block">
                <span className="term-control-title">Settlement Currency Denomination</span>
                <div className="term-currency-toggle">
                  {(["EGP", "USD", "AED"] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      className={`term-curr-btn ${selectedCurrency === curr ? "active" : ""}`}
                      onClick={() => setSelectedCurrency(curr)}
                    >
                      {curr} {curr === "USD" ? "($48.85)" : curr === "AED" ? "(13.30)" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="term-control-block">
                <span className="term-control-title">Corridor Benchmark</span>
                <select
                  className="term-select"
                  value={selectedCorridorKey}
                  onChange={(e) =>
                    setSelectedCorridorKey(e.target.value as keyof typeof CORRIDOR_YIELDS)
                  }
                >
                  <option value="goldensq">Golden Square, New Cairo (9.2% Net Yield)</option>
                  <option value="sahel">Ras El Hekma / Sahel (14.2% Seasonal Yield)</option>
                  <option value="zayed">Karmell &amp; New Zayed (8.6% Net Yield)</option>
                  <option value="gouna">El Gouna Lagoon Estates (11.5% Net Yield)</option>
                </select>
              </div>

              <div className="terminal-footer-note">
                <strong>Arbitrage Insight:</strong> For offshore or USD capital allocators, ready resale
                acquisitions provide an instant 24% to 28% cash-discount arbitrage. For domestic balance
                sheets, 8-year 0% developer installments provide sovereign inflationary shielding.
              </div>
            </div>

            {/* Comparison Balance Sheet */}
            <div className="terminal-sheet-col">
              <div className="sheet-grid-columns">
                {/* Option A: Primary 8-Yr Card */}
                <div className="sheet-card mode-primary">
                  <div className="sheet-header-line">
                    <span className="sheet-card-title">Option A: Primary Launch</span>
                    <span className="sheet-badge badge-neutral">8-Yr 0% Schedule</span>
                  </div>
                  <div className="sheet-main-number">
                    {selectedCurrency === "EGP"
                      ? `EGP ${(downPaymentEgp / 1000000).toFixed(2)}M`
                      : `${fx.prefix}${Math.round(downPaymentEgp / fx.rate).toLocaleString()}`}
                  </div>
                  <div className="sheet-main-label">Initial 10% Reservation &amp; Down Payment</div>

                  <div className="sheet-rows-list">
                    <div className="sheet-data-row">
                      <span>Quarterly Outlay (32 Qtrs):</span>
                      <span className="val">
                        {selectedCurrency === "EGP"
                          ? `EGP ${Math.round(quarterlyOutlayEgp).toLocaleString()}`
                          : `${fx.prefix}${Math.round(quarterlyOutlayEgp / fx.rate).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Nominal Financing Cost:</span>
                      <span className="val" style={{ color: "var(--sage)" }}>
                        0.0% (Developer Subsidized)
                      </span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Capital Gain at Handover:</span>
                      <span className="val">+48.5% (Projected)</span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Handover Timeline:</span>
                      <span className="val">Q4 2027 / Q2 2028</span>
                    </div>
                  </div>
                </div>

                {/* Option B: Resale Secondary Card */}
                <div className="sheet-card mode-resale">
                  <div className="sheet-header-line">
                    <span className="sheet-card-title">Option B: Ready Resale</span>
                    <span className="sheet-badge badge-brass">Immediate Cashflow</span>
                  </div>
                  <div className="sheet-main-number">
                    {selectedCurrency === "EGP"
                      ? `EGP ${(grossRentEgp / 1000000).toFixed(2)}M / yr`
                      : `${fx.prefix}${(grossRentEgp / fx.rate / 1000000).toFixed(2)}M / yr`}
                  </div>
                  <div className="sheet-main-label">Estimated Gross Annual Rental Cashflow</div>

                  <div className="sheet-rows-list">
                    <div className="sheet-data-row">
                      <span>Net Sovereign Yield:</span>
                      <span className="val" style={{ color: "var(--brass-200)" }}>
                        {(corridorData.yieldRate * 100).toFixed(1)}% Net
                      </span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Cash Purchase Discount:</span>
                      <span className="val" style={{ color: "#4ADE80" }}>
                        -{(corridorData.cashDiscount * 100).toFixed(0)}% (
                        {(cashDiscountEgp / 1000000).toFixed(1)}M saved)
                      </span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Payback Horizon:</span>
                      <span className="val">{paybackYears} Years</span>
                    </div>
                    <div className="sheet-data-row">
                      <span>Physical Status:</span>
                      <span className="val" style={{ color: "#4ADE80" }}>
                        Ready for Immediate Letting
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--line)",
                  fontSize: "13px",
                }}
              >
                <span style={{ color: "var(--ink-3)" }}>Settly Market Intelligence &amp; Analytics</span>
                <Link
                  href="/compare"
                  style={{ color: "var(--navy-900)", fontWeight: 700, textDecoration: "none" }}
                >
                  Compare Specific Units in Catalog →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Audited Master Developer League Table */}
      <section className="mi-chart-section" id="developerAudits">
        <div className="wrap">
          <div className="mi-section-head">
            <h2 className="mi-section-h2">Audited Master Developer League Table</h2>
            <p className="mi-section-lead">
              Independent tracking verifying on-time delivery punctuality, construction velocity,
              developer track records, and customer handover satisfaction across Egypt&apos;s 6 Tier-1 developers.
            </p>
          </div>

          <div className="mi-table-box">
            <div className="table-toolbar-row">
              <div className="table-tab-group" role="group" aria-label="Region filter">
                {[
                  { id: "all", label: "All Master Developers (6)" },
                  { id: "east", label: "East Cairo" },
                  { id: "west", label: "West Cairo" },
                  { id: "coastal", label: "Coastal (Sahel / Gouna)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`tbl-tab-btn ${tableFilter === tab.id ? "active" : ""}`}
                    onClick={() => setTableFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: "var(--mono-ui)", fontSize: "11.5px", color: "var(--ink-3)" }}>
                Verified Developer Status: 100%
              </div>
            </div>

            <div className="league-table-wrap">
              <table className="league-table">
                <thead>
                  <tr>
                    <th>Master Developer</th>
                    <th>Land Bank</th>
                    <th>Delivered Units</th>
                    <th>Delivery Punctuality</th>
                    <th>Track Record</th>
                    <th>Handover CSAT</th>
                    <th>Prime Communities</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevelopers.map((dev) => (
                    <tr key={dev.id}>
                      <td>
                        <div className="dev-identity-cell">
                          <div className="dev-monogram">{dev.monogram}</div>
                          <div>
                            <div>{dev.name}</div>
                            <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--ink-3)" }}>
                              {dev.egxTag}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--mono-ui)", fontWeight: 600 }}>{dev.landBank}</td>
                      <td style={{ fontFamily: "var(--mono-ui)", fontWeight: 600 }}>{dev.deliveredUnits}</td>
                      <td>
                        <div className="pct-bar-container">
                          <div className="pct-track">
                            <div className="pct-fill" style={{ width: `${dev.punctualityPct}%` }} />
                          </div>
                          <span style={{ fontFamily: "var(--mono-ui)", fontWeight: 700 }}>
                            {dev.punctualityPct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="escrow-verified-seal">{dev.trackRecord}</span>
                      </td>
                      <td style={{ fontFamily: "var(--mono-ui)", fontWeight: 700, color: "var(--sage)" }}>
                        {dev.csat}
                      </td>
                      <td style={{ fontSize: "12.5px", color: "var(--ink-2)" }}>{dev.communities}</td>
                      <td>
                        <span
                          style={{
                            color: "var(--sage)",
                            fontWeight: 700,
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                          <span>Audited Q1 &apos;26</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Foreign Capital Origin & Sovereign Telemetry */}
      <section className="mi-chart-section">
        <div className="wrap">
          <div className="mi-section-head">
            <h2 className="mi-section-h2">Foreign Capital Origins &amp; Settlement Currencies</h2>
            <p className="mi-section-lead">
              Distribution of international and diaspora liquidity across luxury acquisitions exceeding
              EGP 20M+ in Greater Cairo and coastal zones.
            </p>
          </div>

          <div className="capital-telemetry-grid">
            {/* Geographic Sources */}
            <div className="cap-panel">
              <div className="cap-panel-head">
                <h3>Geographic Allocation of Foreign Capital</h3>
                <p>Tracking the origin of registered cross-border capital deployed into Egyptian prime real estate.</p>
              </div>

              <div className="inflow-rows-group">
                <div className="inflow-item-line">
                  <div className="inflow-meta-line">
                    <span className="inflow-name">Gulf Cooperation Council (UAE, KSA, Qatar)</span>
                    <span className="inflow-num">42% (EGP 20.2B)</span>
                  </div>
                  <div className="inflow-bar-slot">
                    <div className="inflow-bar-level level-gcc" style={{ width: "42%" }} />
                  </div>
                </div>

                <div className="inflow-item-line">
                  <div className="inflow-meta-line">
                    <span className="inflow-name">Expatriate &amp; Overseas Buyers</span>
                    <span className="inflow-num">31% (EGP 14.9B)</span>
                  </div>
                  <div className="inflow-bar-slot">
                    <div className="inflow-bar-level level-expat" style={{ width: "31%" }} />
                  </div>
                </div>

                <div className="inflow-item-line">
                  <div className="inflow-meta-line">
                    <span className="inflow-name">European &amp; North American Family Offices</span>
                    <span className="inflow-num">16% (EGP 7.7B)</span>
                  </div>
                  <div className="inflow-bar-slot">
                    <div className="inflow-bar-level level-europe" style={{ width: "16%" }} />
                  </div>
                </div>

                <div className="inflow-item-line">
                  <div className="inflow-meta-line">
                    <span className="inflow-name">Domestic Institutional Treasuries</span>
                    <span className="inflow-num">11% (EGP 5.4B)</span>
                  </div>
                  <div className="inflow-bar-slot">
                    <div className="inflow-bar-level level-domestic" style={{ width: "11%" }} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontFamily: "var(--mono-ui)",
                  fontSize: "11px",
                  color: "var(--ink-3)",
                  marginTop: "1.5rem",
                }}
              >
                Source: Ministry of Housing &amp; Settly Regulatory Registry (N = 1,240 Verified Transactions)
              </div>
            </div>

            {/* Settlement Currencies */}
            <div className="cap-panel">
              <div className="cap-panel-head">
                <h3>Settlement Currency Distribution</h3>
                <p>Contractual denominating currency utilized across primary and secondary luxury closings.</p>
              </div>

              <div>
                <div className="currency-distribution-bar">
                  <div className="bar-usd">USD 58%</div>
                  <div className="bar-egp">EGP 34%</div>
                  <div className="bar-other">8%</div>
                </div>

                <div style={{ display: "flex", gap: "1.25rem", fontSize: "12.5px", color: "var(--ink-2)", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#0B111F" }} />
                    <strong>USD:</strong> 58% Offshore Wire
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--brass)" }} />
                    <strong>EGP:</strong> 34% Local Currency
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "var(--sage)" }} />
                    <strong>AED / EUR:</strong> 8% Bilateral
                  </span>
                </div>

                <div className="escrow-mandate-card">
                  <strong style={{ color: "var(--navy-900)", display: "block", marginBottom: "4px" }}>
                    Settly Secure Deposit Protection:
                  </strong>
                  Foreign-currency capital deposits are held in Central Bank-licensed escrow accounts. Disbursements
                  to developers require certified engineering milestone verification by the New Urban
                  Communities Authority (NUCA).
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--navy-900)" }}>
                  Institutional Currency Settlement Desk
                </span>
                <a
                  href="#institutionalBriefing"
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 700,
                    color: "var(--brass-600)",
                    textDecoration: "none",
                  }}
                >
                  Inquire with Treasury Desk →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Institutional Research Library & Dossiers */}
      <section className="mi-chart-section" style={{ background: "#fff" }}>
        <div className="wrap">
          <div className="mi-section-head">
            <h2 className="mi-section-h2">Institutional Research Library</h2>
            <p className="mi-section-lead">
              Authoritative 30+ page macro intelligence publications authored by Settly&apos;s sovereign advisory
              and research divisions for family offices and institutional acquirers.
            </p>
          </div>

          <div className="mi-dossiers-grid">
            {/* Dossier 1 */}
            <div className="mi-dossier-card">
              <div className="dossier-media-frame">
                <Image
                  src="/images/10.jpg"
                  alt="Ras El Hekma Horizon"
                  fill
                  className="object-cover"
                />
                <span className="dossier-edition-badge">Sovereign Focus</span>
              </div>
              <div className="dossier-content-body">
                <div>
                  <div className="dossier-meta-date">Published Feb 2026 · 38 Pages · PDF 14.2 MB</div>
                  <h3 className="dossier-card-title">
                    The Ras El Hekma Horizon: 10-Year Coastal Sovereign Capital Analysis
                  </h3>
                  <p className="dossier-summary-text">
                    Exhaustive econometric breakdown of the $35B master agreement, infrastructure milestones,
                    freehold master developers, and projected 10-year IRR for frontline Mediterranean beachfront assets.
                  </p>
                </div>
                <div className="dossier-action-bar">
                  <span style={{ fontFamily: "var(--mono-ui)", fontSize: "11px", color: "var(--ink-3)" }}>
                    Dr. H. El-Gazzar
                  </span>
                  <button
                    type="button"
                    className="btn-download-trigger"
                    onClick={() =>
                      openDossierModal(
                        "The Ras El Hekma Horizon",
                        "38 Pages · Sovereign Coastal Analysis"
                      )
                    }
                  >
                    <span>Download Dossier</span>
                    <FileDown size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dossier 2 */}
            <div className="mi-dossier-card">
              <div className="dossier-media-frame">
                <Image
                  src="/images/7.jpg"
                  alt="New Cairo vs New Capital"
                  fill
                  className="object-cover"
                />
                <span className="dossier-edition-badge">Urban Transition</span>
              </div>
              <div className="dossier-content-body">
                <div>
                  <div className="dossier-meta-date">Published Jan 2026 · 32 Pages · PDF 11.8 MB</div>
                  <h3 className="dossier-card-title">
                    New Cairo vs. New Capital: Commercial Spine Absorption &amp; Spillovers
                  </h3>
                  <p className="dossier-summary-text">
                    Empirical analysis of ministry relocations, commercial bank headquarters along Road 90,
                    and residential value migration between Golden Square, Mostakbal City, and the New Capital.
                  </p>
                </div>
                <div className="dossier-action-bar">
                  <span style={{ fontFamily: "var(--mono-ui)", fontSize: "11px", color: "var(--ink-3)" }}>
                    K. El-Shennawy
                  </span>
                  <button
                    type="button"
                    className="btn-download-trigger"
                    onClick={() =>
                      openDossierModal(
                        "New Cairo vs. New Capital",
                        "32 Pages · Urban Transition Analysis"
                      )
                    }
                  >
                    <span>Download Dossier</span>
                    <FileDown size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Dossier 3 */}
            <div className="mi-dossier-card">
              <div className="dossier-media-frame">
                <Image
                  src="/images/6.jpg"
                  alt="Currency Floatation & Hedging"
                  fill
                  className="object-cover"
                />
                <span className="dossier-edition-badge">Financial Strategy</span>
              </div>
              <div className="dossier-content-body">
                <div>
                  <div className="dossier-meta-date">Published Dec 2025 · 26 Pages · PDF 9.4 MB</div>
                  <h3 className="dossier-card-title">
                    Inflationary Hedging &amp; Multi-Currency Settlement Frameworks
                  </h3>
                  <p className="dossier-summary-text">
                    Structuring prime acquisitions through 8-year developer payment plans at 0% nominal
                    interest as synthetic sovereign debt hedges against currency depreciation.
                  </p>
                </div>
                <div className="dossier-action-bar">
                  <span style={{ fontFamily: "var(--mono-ui)", fontSize: "11px", color: "var(--ink-3)" }}>
                    Settly Research
                  </span>
                  <button
                    type="button"
                    className="btn-download-trigger"
                    onClick={() =>
                      openDossierModal(
                        "Inflationary Hedging Frameworks",
                        "26 Pages · Financial Strategy Dossier"
                      )
                    }
                  >
                    <span>Download Dossier</span>
                    <FileDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Pre-Footer Private Advisory Strip */}
      <section className="pre-ftr-strip" id="institutionalBriefing">
        <div className="wrap pre-ftr-row">
          <div className="pre-ftr-text">
            <h3>Require Bespoke Institutional Allocation or Portfolio Underwriting?</h3>
            <p>
              Connect directly with Settly&apos;s Chief Macroeconomist and Private Wealth Advisory Desk.
              We provide customized financial models, escrow audits, and off-market parcel representation
              for family offices and institutional buyers.
            </p>
          </div>
          <div className="pre-ftr-actions">
            <a
              href="https://wa.me/201000000000?text=Hello%20Settly%20Research,%20I%20would%20like%20to%20schedule%20an%20institutional%20market%20intelligence%20briefing."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pre-ftr-wa"
            >
              <Phone size={16} />
              <span>WhatsApp Chief Economist</span>
            </a>
            <a href="tel:+20221298000" className="btn-pre-ftr-call">
              <Phone size={15} />
              <span>+20 (2) 2129 8000</span>
            </a>
          </div>
        </div>
      </section>

      {/* Institutional PDF Download Modal */}
      {modalOpen && (
        <div
          className="dossier-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="dossier-modal-window">
            <button
              type="button"
              className="dossier-modal-close"
              onClick={() => setModalOpen(false)}
            >
              <X size={18} />
            </button>
            <div
              style={{
                fontFamily: "var(--mono-ui)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--brass-600)",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Institutional Publication Dispatch
            </div>
            <h3
              style={{
                fontFamily: "var(--serif-display)",
                fontSize: "21px",
                fontWeight: 600,
                color: "var(--navy-900)",
                margin: "0 0 0.5rem",
              }}
            >
              {modalTitle}
            </h3>
            <p style={{ fontSize: "13.5px", color: "var(--ink-2)", margin: "0 0 1.5rem" }}>
              {modalSub}
            </p>

            {emailSubmitted ? (
              <div
                style={{
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  textAlign: "center",
                  color: "#065F46",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                Verification complete! Your encrypted institutional research dossier download has begun.
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--navy-900)",
                      marginBottom: "4px",
                    }}
                  >
                    Institutional / Investor Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="investor@familyoffice.com"
                    className="term-select"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--navy-900)",
                      marginBottom: "4px",
                    }}
                  >
                    Organization / Fund Type
                  </label>
                  <select className="term-select" style={{ width: "100%", boxSizing: "border-box" }}>
                    <option>Family Office / Sovereign Wealth</option>
                    <option>Private Real Estate Fund</option>
                    <option>High-Net-Worth Private Acquirer</option>
                    <option>Commercial Bank Treasury Desk</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-hero-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    marginTop: "0.5rem",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  <span>Instant Download (.PDF)</span>
                </button>
              </form>
            )}

            <div
              style={{
                fontSize: "11px",
                fontFamily: "var(--mono-ui)",
                color: "var(--ink-3)",
                marginTop: "1rem",
                textAlign: "center",
              }}
            >
              Encrypted download link dispatched immediately. Zero promotional spam.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
