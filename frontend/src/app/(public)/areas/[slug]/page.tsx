"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Share2,
  FileDown,
  Check,
  ShieldCheck,
  Phone,
} from "lucide-react";
import type { CompoundPerimeter } from "@/components/areas/AreaDetailMap";
import "@/styles/settly/area-detail.css";

// Dynamic Leaflet Map Component (Client-Side Only)
const AreaDetailMap = dynamic(
  () => import("@/components/areas/AreaDetailMap").then((mod) => mod.AreaDetailMap),
  {
    ssr: false,
    loading: () => (
      <div className="gis-canvas-box flex items-center justify-center bg-[#F7F6F3]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#C69749] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-serif text-base text-[#131D36] font-medium">Calibrating Masterplan Perimeter...</p>
          <p className="text-xs text-[#64748B] font-mono mt-1">Rendering GIS satellite compound polygons</p>
        </div>
      </div>
    ),
  }
);

interface AreaDossierData {
  slug: string;
  nameEn: string;
  nameAr: string;
  region: string;
  heroTagline: string;
  heroDescription: string;
  heroBgImage: string;
  benchmarkRate: number;
  rateUnit: string;
  capitalGrowth12m: string;
  verifiedInventory: number;
  greenLakeRatio: string;
  centerCoords: [number, number];
  zoom: number;
  compounds: CompoundPerimeter[];
  featuredResidences: {
    id: string;
    title: string;
    developerZone: string;
    priceEgp: string;
    specs: string;
    image: string;
  }[];
  commuteNodes: {
    time: string;
    destination: string;
    distanceRoute: string;
  }[];
  specialist: {
    name: string;
    role: string;
    experience: string;
    avatar: string;
    phone: string;
    whatsapp: string;
    bio: string;
  };
}

const DOSSIER_REGISTRY: Record<string, AreaDossierData> = {
  "new-cairo": {
    slug: "new-cairo",
    nameEn: "Golden Square Corridor",
    nameAr: "القاهرة الجديدة والمربع الذهبي",
    region: "East Cairo",
    heroTagline: "Golden Square Micro-Market Dossier",
    heroDescription:
      "New Cairo's definitive ultra-low-density villa corridor. Encompassing 3.4 square kilometers of interconnected private lake networks, 82% open parkland, and sovereign freehold title deeds across Egypt's most prestigious master communities.",
    heroBgImage: "/images/11.jpg",
    benchmarkRate: 68500,
    rateUnit: "EGP / m²",
    capitalGrowth12m: "+44.2%",
    verifiedInventory: 142,
    greenLakeRatio: "82% Open",
    centerCoords: [30.0155, 31.488],
    zoom: 14,
    compounds: [
      {
        name: "Lake View Signature",
        developer: "Palm Hills",
        rate: "60.2k/m²",
        coords: [30.016, 31.487],
        poly: [
          [30.0185, 31.482],
          [30.021, 31.491],
          [30.0135, 31.494],
          [30.0115, 31.484],
        ],
        color: "#C69749",
      },
      {
        name: "Mivida Crescent",
        developer: "Emaar Misr",
        rate: "72.4k/m²",
        coords: [30.008, 31.505],
        poly: [
          [30.012, 31.499],
          [30.0145, 31.512],
          [30.004, 31.516],
          [30.001, 31.502],
        ],
        color: "#3D5A4C",
      },
      {
        name: "Villette Estates",
        developer: "SODIC",
        rate: "58.9k/m²",
        coords: [30.025, 31.478],
        poly: [
          [30.028, 31.472],
          [30.0305, 31.484],
          [30.021, 31.486],
          [30.019, 31.474],
        ],
        color: "#1E2A4A",
      },
    ],
    featuredResidences: [
      {
        id: "prop-1",
        title: "Lake View Signature Villa",
        developerZone: "Palm Hills · Zone A",
        priceEgp: "32,500,000 EGP",
        specs: "5 Beds · 6 Baths · 540 m²",
        image: "/images/1.jpg",
      },
      {
        id: "prop-2",
        title: "Mivida Crescent Standalone",
        developerZone: "Emaar Misr · Crescent",
        priceEgp: "44,000,000 EGP",
        specs: "5 Beds · 6 Baths · 480 m²",
        image: "/images/3.jpg",
      },
    ],
    commuteNodes: [
      { time: "7 min", destination: "AUC Campus", distanceRoute: "4.2 km · South 90th" },
      { time: "18 min", destination: "Cairo Airport", distanceRoute: "22 km · Suez Highway" },
      { time: "15 min", destination: "New Capital", distanceRoute: "18 km · Bin Zayed Axis" },
      { time: "11 min", destination: "The Waterway 5A", distanceRoute: "8.8 km · North 90th" },
      { time: "3 min", destination: "Monorail Station", distanceRoute: "650 m · Pedestrian" },
      { time: "22 min", destination: "Maadi Ring Road", distanceRoute: "26 km · Ring Road" },
    ],
    specialist: {
      name: "Karim El-Shennawy",
      role: "Senior Corridor Advisor",
      experience: "8 Yrs Experience",
      avatar: "/images/phone.jpg",
      phone: "+201000000000",
      whatsapp: "https://wa.me/201000000000",
      bio: "Confidential representation for private buyers in Lake View, Mivida, and Villette. Direct developer allocation terms & 0% transfer fee inventory.",
    },
  },
  "golden-square": {
    slug: "golden-square",
    nameEn: "Golden Square Corridor",
    nameAr: "المربع الذهبي",
    region: "East Cairo",
    heroTagline: "Golden Square Micro-Market Dossier",
    heroDescription:
      "New Cairo's definitive ultra-low-density villa corridor. Encompassing 3.4 square kilometers of interconnected private lake networks, 82% open parkland, and sovereign freehold title deeds across Egypt's most prestigious master communities.",
    heroBgImage: "/images/11.jpg",
    benchmarkRate: 68500,
    rateUnit: "EGP / m²",
    capitalGrowth12m: "+44.2%",
    verifiedInventory: 142,
    greenLakeRatio: "82% Open",
    centerCoords: [30.0155, 31.488],
    zoom: 14,
    compounds: [
      {
        name: "Lake View Signature",
        developer: "Palm Hills",
        rate: "60.2k/m²",
        coords: [30.016, 31.487],
        poly: [
          [30.0185, 31.482],
          [30.021, 31.491],
          [30.0135, 31.494],
          [30.0115, 31.484],
        ],
        color: "#C69749",
      },
      {
        name: "Mivida Crescent",
        developer: "Emaar Misr",
        rate: "72.4k/m²",
        coords: [30.008, 31.505],
        poly: [
          [30.012, 31.499],
          [30.0145, 31.512],
          [30.004, 31.516],
          [30.001, 31.502],
        ],
        color: "#3D5A4C",
      },
      {
        name: "Villette Estates",
        developer: "SODIC",
        rate: "58.9k/m²",
        coords: [30.025, 31.478],
        poly: [
          [30.028, 31.472],
          [30.0305, 31.484],
          [30.021, 31.486],
          [30.019, 31.474],
        ],
        color: "#1E2A4A",
      },
    ],
    featuredResidences: [
      {
        id: "prop-1",
        title: "Lake View Signature Villa",
        developerZone: "Palm Hills · Zone A",
        priceEgp: "32,500,000 EGP",
        specs: "5 Beds · 6 Baths · 540 m²",
        image: "/images/1.jpg",
      },
      {
        id: "prop-2",
        title: "Mivida Crescent Standalone",
        developerZone: "Emaar Misr · Crescent",
        priceEgp: "44,000,000 EGP",
        specs: "5 Beds · 6 Baths · 480 m²",
        image: "/images/3.jpg",
      },
    ],
    commuteNodes: [
      { time: "7 min", destination: "AUC Campus", distanceRoute: "4.2 km · South 90th" },
      { time: "18 min", destination: "Cairo Airport", distanceRoute: "22 km · Suez Highway" },
      { time: "15 min", destination: "New Capital", distanceRoute: "18 km · Bin Zayed Axis" },
      { time: "11 min", destination: "The Waterway 5A", distanceRoute: "8.8 km · North 90th" },
      { time: "3 min", destination: "Monorail Station", distanceRoute: "650 m · Pedestrian" },
      { time: "22 min", destination: "Maadi Ring Road", distanceRoute: "26 km · Ring Road" },
    ],
    specialist: {
      name: "Karim El-Shennawy",
      role: "Senior Corridor Advisor",
      experience: "8 Yrs Experience",
      avatar: "/images/phone.jpg",
      phone: "+201000000000",
      whatsapp: "https://wa.me/201000000000",
      bio: "Confidential representation for private buyers in Lake View, Mivida, and Villette. Direct developer allocation terms & 0% transfer fee inventory.",
    },
  },
  "sheikh-zayed": {
    slug: "sheikh-zayed",
    nameEn: "Sheikh Zayed & New Zayed",
    nameAr: "الشيخ زايد وتوسعات نيو زايد",
    region: "West Cairo",
    heroTagline: "West Cairo Premier Living & GEM Axis",
    heroDescription:
      "West Cairo's highest concentration of master-planned greenery, expansive standalone villas, prestigious international academic institutes, and direct accessibility to the Grand Egyptian Museum corridor.",
    heroBgImage: "/images/2.jpg",
    benchmarkRate: 58200,
    rateUnit: "EGP / m²",
    capitalGrowth12m: "+26.8%",
    verifiedInventory: 98,
    greenLakeRatio: "74% Green",
    centerCoords: [30.055, 30.985],
    zoom: 13,
    compounds: [
      {
        name: "Allegria Golf Enclave",
        developer: "SODIC",
        rate: "64.5k/m²",
        coords: [30.062, 30.978],
        poly: [
          [30.065, 30.972],
          [30.068, 30.984],
          [30.058, 30.986],
          [30.056, 30.975],
        ],
        color: "#C69749",
      },
      {
        name: "Cairo Gate",
        developer: "Emaar Misr",
        rate: "68.2k/m²",
        coords: [30.048, 30.995],
        poly: [
          [30.052, 30.991],
          [30.054, 31.002],
          [30.044, 31.004],
          [30.042, 30.993],
        ],
        color: "#1E2A4A",
      },
    ],
    featuredResidences: [
      {
        id: "prop-3",
        title: "Allegria Signature Fairway Villa",
        developerZone: "SODIC · Hole 14",
        priceEgp: "38,000,000 EGP",
        specs: "4 Beds · 5 Baths · 490 m²",
        image: "/images/2.jpg",
      },
      {
        id: "prop-4",
        title: "Cairo Gate Grand Residence",
        developerZone: "Emaar Misr · El Patio",
        priceEgp: "29,500,000 EGP",
        specs: "4 Beds · 4 Baths · 380 m²",
        image: "/images/4.jpg",
      },
    ],
    commuteNodes: [
      { time: "8 min", destination: "Hyper One & Arkan", distanceRoute: "5.4 km · 26th July" },
      { time: "14 min", destination: "Grand Egyptian Museum", distanceRoute: "14 km · Cairo-Alex Rd" },
      { time: "25 min", destination: "Sphinx Int'l Airport", distanceRoute: "21 km · Rod El Farag" },
      { time: "20 min", destination: "Smart Village", distanceRoute: "16 km · Desert Road" },
      { time: "30 min", destination: "Zamalek & Downtown", distanceRoute: "28 km · 26th July Axis" },
      { time: "5 min", destination: "Dahshour Link", distanceRoute: "3 km · Direct" },
    ],
    specialist: {
      name: "Tarek El-Gazzar",
      role: "West Cairo Senior Partner",
      experience: "11 Yrs Experience",
      avatar: "/images/phone.jpg",
      phone: "+201000000000",
      whatsapp: "https://wa.me/201000000000",
      bio: "Advising private investors and diplomats across Allegria, Cairo Gate, and Karmell. Expert in West Cairo title deed verification.",
    },
  },
  "north-coast": {
    slug: "north-coast",
    nameEn: "North Coast & Ras El Hekma",
    nameAr: "الساحل الشمالي ورأس الحكمة",
    region: "North Coast",
    heroTagline: "Mediterranean Riviera Sovereign Investment Mega-Zone",
    heroDescription:
      "Global sovereign capital investments, crystal-clear turquoise waters, mega yacht marinas, and ultra-high seasonal and short-let foreign currency rental yields.",
    heroBgImage: "/images/5.jpg",
    benchmarkRate: 94000,
    rateUnit: "EGP / m²",
    capitalGrowth12m: "+38.5%",
    verifiedInventory: 84,
    greenLakeRatio: "90% Shore",
    centerCoords: [31.05, 28.55],
    zoom: 12,
    compounds: [
      {
        name: "Ras El Hekma Sovereign Waterfront",
        developer: "Modon & ADQ",
        rate: "110k/m²",
        coords: [31.055, 28.555],
        poly: [
          [31.065, 28.545],
          [31.072, 28.568],
          [31.045, 28.572],
          [31.042, 28.548],
        ],
        color: "#C69749",
      },
    ],
    featuredResidences: [
      {
        id: "prop-5",
        title: "Ras El Hekma Beachfront Chalet",
        developerZone: "ADQ Mega City",
        priceEgp: "48,000,000 EGP",
        specs: "4 Beds · 4 Baths · 320 m²",
        image: "/images/5.jpg",
      },
    ],
    commuteNodes: [
      { time: "25 min", destination: "Al Alamein Int'l Airport", distanceRoute: "32 km · Coastal Hwy" },
      { time: "15 min", destination: "New Alamein Towers", distanceRoute: "18 km · Matrouh Rd" },
      { time: "2.5 hrs", destination: "Cairo via Dabaa Axis", distanceRoute: "210 km · Highway" },
    ],
    specialist: {
      name: "Sherif Mansour",
      role: "Coastal & Resort Asset Director",
      experience: "9 Yrs Experience",
      avatar: "/images/phone.jpg",
      phone: "+201000000000",
      whatsapp: "https://wa.me/201000000000",
      bio: "Guiding institutional buyers and international family offices on sovereign Ras El Hekma frontline waterfront allocations.",
    },
  },
  "el-gouna": {
    slug: "el-gouna",
    nameEn: "El Gouna & Red Sea Coast",
    nameAr: "الجونة وساحل البحر الأحمر",
    region: "Red Sea",
    heroTagline: "Self-Sustaining Lagoon-Laced Resort Haven",
    heroDescription:
      "Fully carbon-conscious master infrastructure, private airstrips, championship kitesurfing lagoons, and year-round European expat occupancy with foreign currency cash flows.",
    heroBgImage: "/images/7.jpg",
    benchmarkRate: 86500,
    rateUnit: "EGP / m²",
    capitalGrowth12m: "+24.1%",
    verifiedInventory: 65,
    greenLakeRatio: "95% Lagoons",
    centerCoords: [27.395, 33.68],
    zoom: 13,
    compounds: [
      {
        name: "Fanadir Marina Estates",
        developer: "Orascom",
        rate: "92k/m²",
        coords: [27.398, 33.684],
        poly: [
          [27.402, 33.679],
          [27.405, 33.688],
          [27.392, 33.692],
          [27.39, 33.682],
        ],
        color: "#3D5A4C",
      },
    ],
    featuredResidences: [
      {
        id: "prop-6",
        title: "Fanadir Bayfront Lagoon Villa",
        developerZone: "Orascom Development",
        priceEgp: "52,000,000 EGP",
        specs: "5 Beds · 6 Baths · 460 m²",
        image: "/images/7.jpg",
      },
    ],
    commuteNodes: [
      { time: "25 min", destination: "Hurghada Int'l Airport", distanceRoute: "28 km · Coastal Rd" },
      { time: "5 min", destination: "Abu Tig Marina", distanceRoute: "2.1 km · Shuttle" },
      { time: "10 min", destination: "El Gouna Int'l Hospital", distanceRoute: "4 km · Downtown" },
    ],
    specialist: {
      name: "Laila El-Kady",
      role: "Red Sea Coast Specialist",
      experience: "7 Yrs Experience",
      avatar: "/images/phone.jpg",
      phone: "+201000000000",
      whatsapp: "https://wa.me/201000000000",
      bio: "Private acquisitions for lagoon waterfront properties, foreign exchange rental yields, and marina berth rights.",
    },
  },
};

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const [dossier, setDossier] = useState<AreaDossierData>(
    DOSSIER_REGISTRY[slug] || DOSSIER_REGISTRY["new-cairo"]
  );
  const [timeframe, setTimeframe] = useState<"1y" | "3y" | "all">("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [tourRequested, setTourRequested] = useState(false);

  // Fetch backend API insights if available to augment live data
  useEffect(() => {
    async function fetchAreaInsights() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiBase}/api/v1/areas/${slug}/insights`);
        if (res.ok) {
          const remote = await res.json();
          if (remote) {
            setDossier((prev) => ({
              ...prev,
              nameEn: remote.nameEn || prev.nameEn,
              benchmarkRate: remote.avgPricePerSqm || prev.benchmarkRate,
              verifiedInventory: remote.inventoryCount || prev.verifiedInventory,
              capitalGrowth12m: remote.appreciationRate
                ? `+${remote.appreciationRate}%`
                : prev.capitalGrowth12m,
            }));
          }
        }
      } catch {
        // graceful offline fallback to verified DOSSIER_REGISTRY
      }
    }
    fetchAreaInsights();
  }, [slug]);

  // Handle Share link
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  // Handle Print PDF
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Handle Tour Request
  const handleBookTour = () => {
    setTourRequested(true);
    setTimeout(() => setTourRequested(false), 4000);
  };

  // Chart data calculations depending on timeframe
  const chartPoints =
    timeframe === "1y"
      ? [
          { year: "Q1 2025", rate: "58.0k", x: 60, y: 140 },
          { year: "Q2 2025", rate: "61.2k", x: 200, y: 110 },
          { year: "Q3 2025", rate: "64.0k", x: 350, y: 80 },
          { year: "Q4 2025", rate: "66.5k", x: 500, y: 55 },
          { year: "Q1 2026", rate: "68.5k", x: 640, y: 28 },
        ]
      : timeframe === "3y"
      ? [
          { year: "2023", rate: "34.2k", x: 60, y: 155 },
          { year: "2024", rate: "47.5k", x: 200, y: 115 },
          { year: "Mid 2024", rate: "52.0k", x: 350, y: 88 },
          { year: "2025", rate: "58.0k", x: 500, y: 58 },
          { year: "2026", rate: "68.5k", x: 640, y: 28 },
        ]
      : [
          { year: "2022", rate: "24.8k", x: 40, y: 160 },
          { year: "2023", rate: "34.2k", x: 190, y: 132 },
          { year: "2024", rate: "47.5k", x: 340, y: 92 },
          { year: "2025", rate: "58.0k", x: 490, y: 62 },
          { year: "2026", rate: "68.5k", x: 640, y: 28 },
        ];

  return (
    <div className="corridor-page-wrapper">
      {/* Sub-Header Breadcrumb & Action Strip */}
      <div className="corridor-sub-strip">
        <div className="wrap corridor-sub-row">
          <nav className="breadcrumb-trail" aria-label="Breadcrumb">
            <Link href="/">Egypt</Link>
            <span className="sep">/</span>
            <Link href="/areas">Districts</Link>
            <span className="sep">/</span>
            <Link href="/areas">{dossier.region}</Link>
            <span className="sep">/</span>
            <span className="current">{dossier.nameEn}</span>
          </nav>

          <div className="corridor-actions-grp">
            <button
              type="button"
              className="corridor-action-btn"
              onClick={handleShare}
              title="Share corridor link"
              style={copiedLink ? { background: "#3D5A4C", color: "#fff", borderColor: "#3D5A4C" } : {}}
            >
              {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
              <span>{copiedLink ? "Link Copied!" : "Share Dossier"}</span>
            </button>
            <button
              type="button"
              className="corridor-action-btn"
              onClick={handlePrint}
              title="Download official PDF whitepaper"
            >
              <FileDown size={13} />
              <span>Dossier (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Panoramic Dossier Showcase */}
      <section className="corridor-hero">
        <Image
          src={dossier.heroBgImage}
          alt={dossier.nameEn}
          fill
          priority
          className="corridor-hero-bg object-cover"
        />
        <div className="corridor-hero-scrim" />
        <div className="wrap">
          <div className="corridor-hero-content">
            <h1>{dossier.heroTagline}</h1>
            <p>{dossier.heroDescription}</p>

            {/* 4-Metric Telemetry Ribbon */}
            <div className="telemetry-ribbon">
              <div className="telemetry-tile">
                <span className="telemetry-val">
                  {dossier.benchmarkRate.toLocaleString()} {dossier.rateUnit.split("/")[0]}
                </span>
                <span className="telemetry-lbl">Benchmark / m²</span>
              </div>
              <div className="telemetry-tile">
                <span className="telemetry-val" style={{ color: "#4ADE80" }}>
                  {dossier.capitalGrowth12m}
                </span>
                <span className="telemetry-lbl">12-Mo Capital Growth</span>
              </div>
              <div className="telemetry-tile">
                <span className="telemetry-val">{dossier.verifiedInventory} Units</span>
                <span className="telemetry-lbl">Verified Inventory</span>
              </div>
              <div className="telemetry-tile">
                <span className="telemetry-val">{dossier.greenLakeRatio}</span>
                <span className="telemetry-lbl">Green &amp; Lake Ratio</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace & Specialist Column */}
      <main className="corridor-main-section">
        <div className="wrap">
          <div className="corridor-layout">
            
            {/* Left Main Body */}
            <div className="corridor-body-col">
              
              {/* Section 1: Historical Capital Appreciation Engine */}
              <div className="detail-sec-card">
                <div className="sec-card-hdr">
                  <h2>1. Price Trajectory &amp; Capital Appreciation</h2>
                  <span>Historical Trend &amp; Inflection</span>
                </div>

                <div className="chart-toggle-row">
                  <div style={{ fontSize: "13px", color: "var(--ink-2)" }}>
                    Median BUA Benchmark:{" "}
                    <b style={{ fontFamily: "var(--mono-ui)", color: "var(--navy-900)" }}>
                      EGP {dossier.benchmarkRate.toLocaleString()} / m²
                    </b>
                  </div>
                  <div className="time-pill-box" role="group" aria-label="Timeframe selector">
                    <button
                      type="button"
                      className={`time-pill ${timeframe === "1y" ? "active" : ""}`}
                      onClick={() => setTimeframe("1y")}
                    >
                      1 Year
                    </button>
                    <button
                      type="button"
                      className={`time-pill ${timeframe === "3y" ? "active" : ""}`}
                      onClick={() => setTimeframe("3y")}
                    >
                      3 Years
                    </button>
                    <button
                      type="button"
                      className={`time-pill ${timeframe === "all" ? "active" : ""}`}
                      onClick={() => setTimeframe("all")}
                    >
                      All-Time (5Y)
                    </button>
                  </div>
                </div>

                {/* Vector SVG Chart */}
                <div className="chart-svg-wrap">
                  <svg className="chart-svg" viewBox="0 0 680 200" fill="none">
                    <defs>
                      <linearGradient id="areaChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C69749" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#C69749" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid Guidelines */}
                    <line x1="0" y1="40" x2="680" y2="40" stroke="#E5E7EB" strokeDasharray="4 4" />
                    <line x1="0" y1="90" x2="680" y2="90" stroke="#E5E7EB" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="680" y2="140" stroke="#E5E7EB" strokeDasharray="4 4" />

                    {/* Area Path */}
                    <path
                      d={`M ${chartPoints[0].x} ${chartPoints[0].y} Q 180 135 320 95 T 520 60 L 640 28 L 640 190 L ${chartPoints[0].x} 190 Z`}
                      fill="url(#areaChartGrad)"
                    />

                    {/* Trend Line */}
                    <path
                      d={`M ${chartPoints[0].x} ${chartPoints[0].y} Q 180 135 320 95 T 520 60 L 640 28`}
                      stroke="#C69749"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Coordinates Data Nodes */}
                    {chartPoints.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === chartPoints.length - 1 ? 6 : 5}
                        fill={idx === chartPoints.length - 1 ? "#166534" : "#131D36"}
                        stroke={idx === chartPoints.length - 1 ? "#fff" : "#C69749"}
                        strokeWidth={idx === chartPoints.length - 1 ? 2 : 2.5}
                      />
                    ))}

                    {/* Value Callout */}
                    <rect x="535" y="2" width="135" height="24" rx="4" fill="#131D36" />
                    <text
                      x="602"
                      y="18"
                      fill="#fff"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {dossier.benchmarkRate.toLocaleString()} EGP/m²
                    </text>
                  </svg>

                  <div className="chart-inflection-labels">
                    {chartPoints.map((pt, idx) => (
                      <div
                        key={idx}
                        style={
                          idx === chartPoints.length - 1
                            ? { fontWeight: 700, color: "#166534" }
                            : {}
                        }
                      >
                        {pt.year} · {pt.rate}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Interactive Leaflet GIS Corridor Map */}
              <div className="detail-sec-card">
                <div className="sec-card-hdr">
                  <h2>2. Spatial Perimeter &amp; Compound Polygons</h2>
                  <span>GIS Real-World Satellite Bounds</span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--ink-2)", marginBottom: "1rem" }}>
                  Inspecting audited perimeters across {dossier.nameEn}. Click any compound boundary
                  or marker to inspect developer benchmarks and master specifications.
                </p>
                <div className="gis-canvas-box">
                  <AreaDetailMap
                    center={dossier.centerCoords}
                    zoom={dossier.zoom}
                    compounds={dossier.compounds}
                  />
                </div>
              </div>

              {/* Section 3: Master Developers & Premier Compound Clusters */}
              <div className="detail-sec-card">
                <div className="sec-card-hdr">
                  <h2>3. Premier Estates in {dossier.nameEn}</h2>
                  <span>{dossier.compounds.length} Audited Master Communities</span>
                </div>
                <div className="compound-clusters-grid">
                  {dossier.compounds.map((comp, idx) => (
                    <div key={idx} className="compound-cluster-card">
                      <div className="cluster-top">
                        <span className="cluster-dev">{comp.developer}</span>
                        <span className="cluster-rate">{comp.rate} Benchmark</span>
                      </div>
                      <div className="cluster-name">{comp.name}</div>
                      <div className="cluster-specs">
                        Verified Title Deeds · Fully Gated · Freehold Foreign Ownership
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Commute & Infrastructure Radar */}
              <div className="detail-sec-card">
                <div className="sec-card-hdr">
                  <h2>4. Infrastructure &amp; Commute Telemetry</h2>
                  <span>Highway Axes &amp; Strategic Transit Times</span>
                </div>
                <div className="commute-matrix-grid">
                  {dossier.commuteNodes.map((node, idx) => (
                    <div key={idx} className="commute-node">
                      <div className="commute-node-time">{node.time}</div>
                      <div className="commute-node-dest">{node.destination}</div>
                      <div className="commute-node-dist">{node.distanceRoute}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Available Residences in Area */}
              <div className="detail-sec-card">
                <div className="sec-card-hdr">
                  <h2>5. Available Residences in {dossier.nameEn}</h2>
                  <Link
                    href={`/search?area=${dossier.slug}`}
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--brass-600)",
                      textDecoration: "none",
                    }}
                  >
                    View all {dossier.verifiedInventory} units →
                  </Link>
                </div>
                <div className="listings-stream-grid">
                  {dossier.featuredResidences.map((item) => (
                    <Link
                      key={item.id}
                      href={`/properties/${item.id}`}
                      className="corridor-listing-card"
                    >
                      <div style={{ position: "relative", width: "100%", aspectRatio: "16/10" }}>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="corridor-listing-body">
                        <span className="corridor-listing-loc">{item.developerZone}</span>
                        <span className="corridor-listing-title">{item.title}</span>
                        <span className="corridor-listing-price">{item.priceEgp}</span>
                        <span
                          style={{
                            fontFamily: "var(--mono-ui)",
                            fontSize: "11px",
                            color: "var(--ink-3)",
                          }}
                        >
                          {item.specs}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sticky Advisory Sidebar */}
            <aside className="corridor-sidebar">
              
              {/* Specialist Advisory Card */}
              <div className="specialist-card">
                <div className="specialist-top">
                  <div
                    style={{
                      position: "relative",
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid var(--brass)",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={dossier.specialist.avatar}
                      alt={dossier.specialist.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="specialist-info">
                    <b>{dossier.specialist.name}</b>
                    <span>
                      {dossier.specialist.role} · {dossier.specialist.experience}
                    </span>
                  </div>
                </div>
                <span className="specialist-badge">
                  <ShieldCheck size={11} strokeWidth={3} />
                  Corridor Desk Lead
                </span>
                <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: "1.5" }}>
                  {dossier.specialist.bio}
                </p>
                <a
                  href={dossier.specialist.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-specialist-wa"
                >
                  <Phone size={15} />
                  <span>WhatsApp Advisor</span>
                </a>
                <button
                  type="button"
                  className="btn-tour-cta"
                  onClick={handleBookTour}
                >
                  {tourRequested ? "Tour Request Dispatched ✓" : "Book Private Corridor Tour"}
                </button>
              </div>

              {/* Whitepaper Download Card */}
              <div className="whitepaper-card">
                <h4>{dossier.nameEn} Whitepaper</h4>
                <p>
                  Download the institutional report with deed registry charts, land allocation decrees,
                  and master developer covenants.
                </p>
                <button
                  type="button"
                  className="btn-whitepaper-dl"
                  onClick={handlePrint}
                  style={{ border: "none", cursor: "pointer" }}
                >
                  Download PDF Report
                </button>
              </div>

            </aside>

          </div>
        </div>
      </main>

      {/* Pre-Footer Private Advisory Strip */}
      <aside className="pre-ftr-strip">
        <div className="wrap pre-ftr-row">
          <div className="pre-ftr-text">
            <h3>Require Private Representation or Off-Market Allocations?</h3>
            <p>
              Settly&apos;s Private Client Desk manages confidential acquisitions, bespoke payment term
              negotiations, and notarized title verification for family offices and institutional investors.
            </p>
          </div>
          <div className="pre-ftr-actions">
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pre-whatsapp"
            >
              <Phone size={15} />
              <span>Speak with Private Advisor</span>
            </a>
            <a href="tel:+20221298000" className="btn-pre-phone">
              <Phone size={14} />
              <span>+20 (2) 2129 8000</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
