"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { 
  Search, 
  TrendingUp, 
  ArrowRight, 
  Sparkles 
} from "lucide-react";
import type { DistrictMapItem } from "@/components/areas/AreaRadarMap";
import "@/styles/settly/areas.css";

// Dynamic Leaflet Map Component (Client-Side Only)
const AreaRadarMap = dynamic(
  () => import("@/components/areas/AreaRadarMap").then((mod) => mod.AreaRadarMap),
  {
    ssr: false,
    loading: () => (
      <div className="area-map-container bg-[#F7F6F3] flex items-center justify-center border border-[rgba(30,42,74,0.12)]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#C69749] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-serif text-base text-navy-900 font-medium">Initializing Spatial GIS Radar...</p>
          <p className="text-xs text-ink-3 font-mono mt-1">Calibrating prime Egyptian micro-market coordinates</p>
        </div>
      </div>
    ),
  }
);

interface DistrictCardItem {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  region: "East Cairo" | "West Cairo" | "North Coast" | "Red Sea";
  description: string;
  avgPricePerSqm: number;
  compoundsCount: number;
  rentalYield: number;
  appreciationYoY: number;
  activePropertiesCount: number;
  coverImage: string;
  anchorDevelopers: string[];
  highlights: string[];
  lat: number;
  lng: number;
}

const DEFAULT_DISTRICTS: DistrictCardItem[] = [
  {
    id: "dist-new-cairo",
    slug: "new-cairo",
    nameEn: "New Cairo & Golden Square",
    nameAr: "القاهرة الجديدة والمربع الذهبي",
    region: "East Cairo",
    description: "Egypt's foremost ultra-prime capital nexus. Characterized by high-security gated compounds, multinational corporate headquarters, and signature golf communities.",
    avgPricePerSqm: 72500,
    compoundsCount: 48,
    rentalYield: 8.9,
    appreciationYoY: 31.4,
    activePropertiesCount: 142,
    coverImage: "/images/properties/property-1.jpg",
    anchorDevelopers: ["Palm Hills", "Emaar Misr", "Mountain View", "SODIC"],
    highlights: ["Direct Monorail & Middle Ring Road links", "Golden Square signature country clubs", "Highest institutional capital inflow"],
    lat: 30.025,
    lng: 31.485,
  },
  {
    id: "dist-sheikh-zayed",
    slug: "sheikh-zayed",
    nameEn: "Sheikh Zayed & New Zayed",
    nameAr: "الشيخ زايد وتوسعات نيو زايد",
    region: "West Cairo",
    description: "The crown jewel of West Cairo. Master-planned greenery, expansive standalone villas, prestigious international academic institutes, and direct accessibility to the Grand Egyptian Museum corridor.",
    avgPricePerSqm: 58200,
    compoundsCount: 36,
    rentalYield: 8.2,
    appreciationYoY: 26.8,
    activePropertiesCount: 98,
    coverImage: "/images/properties/property-2.jpg",
    anchorDevelopers: ["SODIC", "Emaar Misr", "Ora Developers", "Badr El Din"],
    highlights: ["26th of July Corridor & Dahshour Axis", "Prestigious private schools & sports clubs", "High long-term capital preservation"],
    lat: 30.055,
    lng: 30.985,
  },
  {
    id: "dist-ras-el-hekma",
    slug: "north-coast",
    nameEn: "North Coast & Ras El Hekma",
    nameAr: "الساحل الشمالي ورأس الحكمة",
    region: "North Coast",
    description: "The Mediterranean Riviera mega-corridor. Global sovereign investments, turquoise bays, world-class yacht marinas, and ultra-high seasonal rental velocity.",
    avgPricePerSqm: 94000,
    compoundsCount: 29,
    rentalYield: 9.4,
    appreciationYoY: 38.5,
    activePropertiesCount: 84,
    coverImage: "/images/properties/property-3.jpg",
    anchorDevelopers: ["Modon", "Talaat Moustafa Group", "Hassan Allam", "Emaar Misr"],
    highlights: ["Direct Mediterranean coastal frontline", "Sovereign ADQ master development zone", "Peak summer gross yield premiums"],
    lat: 31.05,
    lng: 28.55,
  },
  {
    id: "dist-el-gouna",
    slug: "el-gouna",
    nameEn: "El Gouna & Red Sea Coast",
    nameAr: "الجونة وساحل البحر الأحمر",
    region: "Red Sea",
    description: "Self-sustaining lagoon-laced resort haven. Fully carbon-conscious master infrastructure, private airstrips, championship kitesurfing, and year-round European expat occupancy.",
    avgPricePerSqm: 86500,
    compoundsCount: 18,
    rentalYield: 7.8,
    appreciationYoY: 24.1,
    activePropertiesCount: 65,
    coverImage: "/images/properties/property-4.jpg",
    anchorDevelopers: ["Orascom Development", "Soma Bay Community"],
    highlights: ["100% interconnected lagoon channels", "Direct international flight connectivity", "Year-round foreign currency rental flows"],
    lat: 27.395,
    lng: 33.68,
  },
];

function AreasContent() {
  const [districts, setDistricts] = useState<DistrictCardItem[]>(DEFAULT_DISTRICTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [sortMetric, setSortMetric] = useState<string>("APPRECIATION_DESC");
  const [activePinSlug, setActivePinSlug] = useState<string | null>(null);

  // Fetch areas from backend to augment with DB records if available
  useEffect(() => {
    async function loadAreas() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiBase}/api/v1/areas`);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            // Augment existing rich items with real DB IDs if slugs match
            setDistricts((prev) =>
              prev.map((d) => {
                const match = data.items.find((dbItem: { slug: string; id: string }) => dbItem.slug === d.slug);
                return match ? { ...d, id: match.id } : d;
              })
            );
          }
        }
      } catch (err) {
        console.error("Could not fetch remote areas, using local defaults:", err);
      }
    }
    loadAreas();
  }, []);

  // Filtered & Sorted districts list
  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesQuery =
          searchQuery.trim() === "" ||
          d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.nameAr.includes(searchQuery) ||
          d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.anchorDevelopers.some((dev) => dev.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRegion =
          selectedRegion === "ALL" ||
          d.region.toUpperCase().replace(/\s+/g, "_") === selectedRegion;

        return matchesQuery && matchesRegion;
      })
      .sort((a, b) => {
        if (sortMetric === "PRICE_DESC") return b.avgPricePerSqm - a.avgPricePerSqm;
        if (sortMetric === "PRICE_ASC") return a.avgPricePerSqm - b.avgPricePerSqm;
        if (sortMetric === "APPRECIATION_DESC") return b.appreciationYoY - a.appreciationYoY;
        if (sortMetric === "INVENTORY_DESC") return b.activePropertiesCount - a.activePropertiesCount;
        return a.nameEn.localeCompare(b.nameEn);
      });
  }, [districts, searchQuery, selectedRegion, sortMetric]);

  const mapItems: DistrictMapItem[] = useMemo(() => {
    return filteredDistricts.map((d) => ({
      id: d.id,
      slug: d.slug,
      nameEn: d.nameEn,
      lat: d.lat,
      lng: d.lng,
      avgPricePerSqm: d.avgPricePerSqm,
      region: d.region,
    }));
  }, [filteredDistricts]);

  return (
    <div className="areas-page-wrapper">
      {/* Editorial Hero & Corridor Deck */}
      <section className="area-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="area-hero-top">
            <div className="area-hero-title">
              <h1>Prime Micro-Markets & Districts</h1>
              <p>
                Authoritative spatial dossiers. Cross-analyze capital appreciation velocities, infrastructure
                corridors, and certified developer footprints across Egypt&apos;s high-liquidity residential sub-markets.
              </p>
            </div>

            {/* Macro Telemetry Chips */}
            <div className="macro-stats-row">
              <div className="macro-stat-card">
                <span className="macro-stat-val">4 Corridors</span>
                <span className="macro-stat-lbl">Tier-1 Micro-Markets</span>
              </div>
              <div className="macro-stat-card">
                <span className="macro-stat-val">62,500 EGP</span>
                <span className="macro-stat-lbl">Average Benchmark / m²</span>
              </div>
              <div className="macro-stat-card">
                <span className="macro-stat-val text-green-700">+28.4%</span>
                <span className="macro-stat-lbl">YoY Appreciation</span>
              </div>
              <div className="macro-stat-card">
                <span className="macro-stat-val">100% CAD</span>
                <span className="macro-stat-lbl">Geocoded Boundaries</span>
              </div>
            </div>
          </div>

          {/* Search & Regional Filter Bar */}
          <div className="area-filter-bar">
            {/* Search Input */}
            <div className="area-search-input-wrap">
              <Search className="area-search-icon w-4 h-4" />
              <input
                type="text"
                className="area-search-input"
                placeholder="Filter by district, corridor, or anchor developer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Region Tabs */}
            <div className="region-tabs" role="tablist">
              {[
                { label: "All Regions", value: "ALL" },
                { label: "East Cairo", value: "EAST_CAIRO" },
                { label: "West Cairo", value: "WEST_CAIRO" },
                { label: "North Coast", value: "NORTH_COAST" },
                { label: "Red Sea", value: "RED_SEA" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`region-tab-btn ${selectedRegion === tab.value ? "active" : ""}`}
                  onClick={() => setSelectedRegion(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <select
              className="area-sort-select"
              value={sortMetric}
              onChange={(e) => setSortMetric(e.target.value)}
              aria-label="Sort micro-markets"
            >
              <option value="APPRECIATION_DESC">Highest Capital Growth (YoY)</option>
              <option value="PRICE_DESC">Highest Price / m²</option>
              <option value="PRICE_ASC">Lowest Price / m²</option>
              <option value="INVENTORY_DESC">Largest Active Inventory</option>
              <option value="NAME_ASC">District Name (A–Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Spatial Radar Map Section */}
      <section className="area-map-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AreaRadarMap
            districts={mapItems}
            selectedSlug={activePinSlug}
            onSelectDistrict={(slug) => {
              setActivePinSlug(slug);
              const cardEl = document.getElementById(`district-card-${slug}`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          />
        </div>
      </section>

      {/* Main Districts Grid Section */}
      <section className="districts-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="districts-grid-hdr">
            <h2 className="font-serif text-2xl font-semibold text-navy-900">
              Verified District Portfolios
            </h2>
            <span className="districts-count-badge">
              Showing {filteredDistricts.length} Micro-Markets
            </span>
          </div>

          <div className="districts-grid">
            {filteredDistricts.map((d) => {
              const isHighlighted = activePinSlug === d.slug;
              return (
                <article
                  key={d.id}
                  id={`district-card-${d.slug}`}
                  className={`district-card ${isHighlighted ? "ring-2 ring-[#C69749]" : ""}`}
                >
                  {/* Card Media Header */}
                  <div className="district-media">
                    <Image
                      src={d.coverImage}
                      alt={d.nameEn}
                      fill
                      className="district-img"
                      sizes="(max-width: 768px) 100vw, 360px"
                    />
                    <span className="district-tag-pill">{d.region}</span>
                    <span className="district-growth-badge">
                      <TrendingUp className="w-3 h-3 text-white" />
                      <span>+{d.appreciationYoY}% YoY</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="district-body">
                    <div className="district-title-wrap">
                      <h3>{d.nameEn}</h3>
                      <p>{d.description}</p>
                    </div>

                    {/* 4-Metric Key Matrix */}
                    <div className="district-metrics-matrix">
                      <div className="district-metric-item">
                        <span className="dist-metric-val">
                          {d.avgPricePerSqm.toLocaleString()} EGP
                        </span>
                        <span className="dist-metric-lbl">Avg Price / m²</span>
                      </div>
                      <div className="district-metric-item">
                        <span className="dist-metric-val">{d.compoundsCount} Compounds</span>
                        <span className="dist-metric-lbl">Gated Masterplans</span>
                      </div>
                      <div className="district-metric-item">
                        <span className="dist-metric-val text-green-700">{d.rentalYield}%</span>
                        <span className="dist-metric-lbl">Avg Prime Yield</span>
                      </div>
                      <div className="district-metric-item">
                        <span className="dist-metric-val">{d.activePropertiesCount} Units</span>
                        <span className="dist-metric-lbl">Available Homes</span>
                      </div>
                    </div>

                    {/* Anchor Developers Chips */}
                    <div className="dist-devs-row">
                      {d.anchorDevelopers.map((dev) => (
                        <span key={dev} className="dist-dev-chip">
                          {dev}
                        </span>
                      ))}
                    </div>

                    {/* Infrastructure Highlights */}
                    <div className="dist-highlights">
                      {d.highlights.map((hl, idx) => (
                        <div key={idx} className="dist-hl-item">
                          <Sparkles className="w-3.5 h-3.5 text-[#AE8033]" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Footer */}
                    <div className="district-card-footer">
                      <Link href={`/areas/${d.slug}`} className="dist-explore-link">
                        <span>Explore District Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/search?area=${d.slug}`}
                        className="dist-active-units hover:text-navy-900 transition"
                      >
                        {d.activePropertiesCount} Verified Listings →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparative Regional Benchmarks Table */}
      <section className="corridor-table-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="corridor-sec-hdr">
            <h2>Macro Corridor Benchmark Matrix</h2>
            <p>Institutional multi-axis telemetry across Egypt&apos;s primary residential corridors.</p>
          </div>

          <div className="corridor-table-wrap">
            <table className="corridor-table">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th>Primary Nodes</th>
                  <th>Avg Price / m²</th>
                  <th>YoY Appreciation</th>
                  <th>Prime Yield</th>
                  <th>Dominant Typology</th>
                  <th>Key Developers</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="font-semibold text-navy-900">East Cairo</div>
                    <span className="text-xs text-ink-3">New Cairo / Golden Sq</span>
                  </td>
                  <td>Fifth Settlement, Katameya, Mostakbal City</td>
                  <td className="font-mono font-bold">72,500 EGP</td>
                  <td className="font-mono text-green-700 font-bold">+31.4%</td>
                  <td className="font-mono">8.9%</td>
                  <td>Luxury Villas & Penthouses</td>
                  <td>Palm Hills, Emaar, Mountain View</td>
                </tr>
                <tr>
                  <td>
                    <div className="font-semibold text-navy-900">West Cairo</div>
                    <span className="text-xs text-ink-3">Sheikh Zayed / New Zayed</span>
                  </td>
                  <td>Zayed Dunes, Al Guezira, Green Belt</td>
                  <td className="font-mono font-bold">58,200 EGP</td>
                  <td className="font-mono text-green-700 font-bold">+26.8%</td>
                  <td className="font-mono">8.2%</td>
                  <td>Standalone Villas & Townhouses</td>
                  <td>SODIC, Emaar, Ora Developers</td>
                </tr>
                <tr>
                  <td>
                    <div className="font-semibold text-navy-900">North Coast</div>
                    <span className="text-xs text-ink-3">Mediterranean Riviera</span>
                  </td>
                  <td>Ras El Hekma, Sidi Abd El Rahman, Marassi</td>
                  <td className="font-mono font-bold">94,000 EGP</td>
                  <td className="font-mono text-green-700 font-bold">+38.5%</td>
                  <td className="font-mono">9.4%</td>
                  <td>Beachfront Chalets & Mansions</td>
                  <td>Modon, TMG, Hassan Allam</td>
                </tr>
                <tr>
                  <td>
                    <div className="font-semibold text-navy-900">Red Sea</div>
                    <span className="text-xs text-ink-3">Coastal Leisure Hub</span>
                  </td>
                  <td>El Gouna, Soma Bay, Sahl Hasheesh</td>
                  <td className="font-mono font-bold">86,500 EGP</td>
                  <td className="font-mono text-green-700 font-bold">+24.1%</td>
                  <td className="font-mono">7.8%</td>
                  <td>Waterfront Villas & Duplexes</td>
                  <td>Orascom Development, Soma Bay</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AreasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F6F3] p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#C69749] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-serif text-lg text-[#131D36]">Loading Prime Micro-Markets Directory...</p>
          </div>
        </div>
      }
    >
      <AreasContent />
    </Suspense>
  );
}
