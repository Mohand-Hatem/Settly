"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PropertyListResponse } from "@/api/catalog";
import { propertyListQuery } from "@/lib/query/catalog";
import dynamic from "next/dynamic";
import { PropertyItem } from "./PropertyCard";
import { DiscoveryBar, ViewMode } from "./DiscoveryBar";
import { FacetRail } from "./FacetRail";
import { PropertyStream } from "./PropertyStream";
import { toPropertyItem } from "./mapProperty";

// Dynamic import of Leaflet map to guarantee zero SSR hydration issues
const DynamicSearchMap = dynamic(
  () => import("./SearchMap").then((mod) => mod.SearchMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "var(--canvas-2)",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--mono-ui)",
          fontSize: "12px",
          color: "var(--ink-3)",
        }}
      >
        Loading Settly GIS Map...
      </div>
    ),
  }
);

// Authentic Cairo dataset directly from docs/design/candidates/settly-landing/public/search.html
const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: "0",
    slug: "lake-view-signature-villa",
    dev: "Palm Hills",
    title: "Lake View Signature Villa",
    specs: "Golden Square · 540 m² · 5 beds · EGP 60,185/m²",
    price: "EGP 32,500,000",
    priceNum: 32500000,
    priceShort: "32.5M",
    sqmPrice: "EGP 60,185 / m²",
    img: "/images/11.jpg",
    lat: 30.0155,
    lng: 31.488,
    inGoldenSquare: true,
    type: "villa",
    location: "Golden Square, New Cairo",
    finish: "Fully Finished",
    plan: "7-Yr Plan",
    downPayment: "10% (3.25M)",
    installment: "EGP 1.04M / qtr",
    interest: "0% Int.",
    beds: 5,
    baths: 6,
    bua: 540,
    plotOrTerrace: "720 m²",
    handover: "Q4 2026",
    amenities: ["Private Pool", "Golf Frontage", "Maid's Room", "Smart Home"],
    subLocation: "Lake View Residence · Zone A",
  },
  {
    id: "1",
    slug: "terrace-skyline-duplex",
    dev: "SODIC",
    title: "Terrace Skyline Duplex",
    specs: "Karmell, Sheikh Zayed · 320 m² · 4 beds · EGP 59,060/m²",
    price: "EGP 18,900,000",
    priceNum: 18900000,
    priceShort: "18.9M",
    sqmPrice: "EGP 59,060 / m²",
    img: "/images/5.jpg",
    lat: 30.038,
    lng: 30.985,
    inGoldenSquare: false,
    type: "duplex",
    location: "Karmell, Sheikh Zayed",
    finish: "Core & Shell",
    plan: "8-Yr Plan",
    downPayment: "5% (945K)",
    installment: "EGP 561K / qtr",
    interest: "0% Int.",
    beds: 4,
    baths: 4,
    bua: 320,
    plotOrTerrace: "65 m²",
    handover: "Q2 2026",
    amenities: ["Double Height", "Panoramic View", "Private Terrace"],
    subLocation: "Karmell West · Phase 1",
  },
  {
    id: "2",
    slug: "azure-horizon-penthouse",
    dev: "Emaar Misr",
    title: "Azure Horizon Penthouse",
    specs: "Sidi Abd El Rahman · 410 m² · 4 beds · EGP 107,317/m²",
    price: "EGP 44,000,000",
    priceNum: 44000000,
    priceShort: "44.0M",
    sqmPrice: "EGP 107,317 / m²",
    img: "/images/8.jpg",
    lat: 30.985,
    lng: 28.71,
    inGoldenSquare: false,
    type: "penthouse",
    location: "Sidi Abd El Rahman, Sahel",
    finish: "Fully Finished",
    plan: "6-Yr Plan",
    downPayment: "15% (6.6M)",
    installment: "EGP 1.55M / qtr",
    interest: "0% Int.",
    beds: 4,
    baths: 5,
    bua: 410,
    plotOrTerrace: "120 m²",
    handover: "Ready to Move",
    amenities: ["Direct Lagoon Access", "Infinity Pool", "Concierge Desk"],
    subLocation: "Marassi · Greek Village",
  },
  {
    id: "3",
    slug: "courtyard-townhouse",
    dev: "Ora Developers",
    title: "Courtyard Townhouse",
    specs: "ZED East, New Cairo · 285 m² · 3 beds · EGP 75,087/m²",
    price: "EGP 21,400,000",
    priceNum: 21400000,
    priceShort: "21.4M",
    sqmPrice: "EGP 75,087 / m²",
    img: "/images/9.jpg",
    lat: 30.0115,
    lng: 31.512,
    inGoldenSquare: true,
    type: "town",
    location: "ZED East, New Cairo",
    finish: "Fully Finished",
    plan: "8-Yr Plan",
    downPayment: "5% (1.07M)",
    installment: "EGP 635K / qtr",
    interest: "0% Int.",
    beds: 3,
    baths: 4,
    bua: 285,
    plotOrTerrace: "210 m²",
    handover: "Q1 2027",
    amenities: ["Clubhouse Membership", "Central Park View", "Smart Access"],
    subLocation: "ZED East · Cluster 4",
  },
  {
    id: "4",
    slug: "katameya-dunes-twin-house",
    dev: "Katameya",
    title: "Katameya Dunes Twin House",
    specs: "5th Settlement · 380 m² · 4 beds · EGP 65,263/m²",
    price: "EGP 24,800,000",
    priceNum: 24800000,
    priceShort: "24.8M",
    sqmPrice: "EGP 65,263 / m²",
    img: "/images/2.jpg",
    lat: 30.008,
    lng: 31.472,
    inGoldenSquare: true,
    type: "town",
    location: "Katameya Dunes, 5th Settlement",
    finish: "Semi Finished",
    plan: "5-Yr Plan",
    downPayment: "20% (4.96M)",
    installment: "EGP 992K / qtr",
    interest: "0% Int.",
    beds: 4,
    baths: 4,
    bua: 380,
    plotOrTerrace: "420 m²",
    handover: "Ready to Move",
    amenities: ["Championship Golf Course", "Private Garden", "Driver Quarters"],
    subLocation: "Katameya Dunes · Fairway 8",
  },
  {
    id: "5",
    slug: "mivida-crescent-standalone",
    dev: "Emaar Misr",
    title: "Mivida Crescent Standalone",
    specs: "Golden Square · 620 m² · 6 beds · EGP 78,225/m²",
    price: "EGP 48,500,000",
    priceNum: 48500000,
    priceShort: "48.5M",
    sqmPrice: "EGP 78,225 / m²",
    img: "/images/7.jpg",
    lat: 30.0185,
    lng: 31.495,
    inGoldenSquare: true,
    type: "villa",
    location: "Mivida, Golden Square",
    finish: "Ultra Super Lux",
    plan: "Cash / Re-sale",
    downPayment: "100% Cash",
    installment: "Immediate Title",
    interest: "Registered",
    beds: 6,
    baths: 7,
    bua: 620,
    plotOrTerrace: "890 m²",
    handover: "Ready to Move",
    amenities: ["Heated Swimming Pool", "Elevator Installed", "Valley Frontage"],
    subLocation: "Mivida Greens · The Crescent",
  },
  {
    id: "6",
    slug: "villette-sky-villa",
    dev: "SODIC",
    title: "Villette Sky Villa",
    specs: "New Cairo · 390 m² · 4 beds · EGP 69,743/m²",
    price: "EGP 27,200,000",
    priceNum: 27200000,
    priceShort: "27.2M",
    sqmPrice: "EGP 69,743 / m²",
    img: "/images/6.jpg",
    lat: 30.021,
    lng: 31.505,
    inGoldenSquare: true,
    type: "duplex",
    location: "Villette, New Cairo",
    finish: "Fully Finished",
    plan: "7-Yr Plan",
    downPayment: "10% (2.72M)",
    installment: "EGP 874K / qtr",
    interest: "0% Int.",
    beds: 4,
    baths: 5,
    bua: 390,
    plotOrTerrace: "80 m²",
    handover: "Q3 2026",
    amenities: ["Private Rooftop Pool", "Pocket Park View", "Underground Parking"],
    subLocation: "Villette Town · Sky Enclave",
  },
  {
    id: "7",
    slug: "palm-court-signature-villa",
    dev: "Palm Hills",
    title: "Palm Court Signature Villa",
    specs: "Mivida · 480 m² · 5 beds · EGP 75,000/m²",
    price: "EGP 36,000,000",
    priceNum: 36000000,
    priceShort: "36.0M",
    sqmPrice: "EGP 75,000 / m²",
    img: "/images/4.jpg",
    lat: 30.016,
    lng: 31.491,
    inGoldenSquare: true,
    type: "villa",
    location: "Palm Hills New Cairo",
    finish: "Fully Finished",
    plan: "7-Yr Plan",
    downPayment: "10% (3.6M)",
    installment: "EGP 1.15M / qtr",
    interest: "0% Int.",
    beds: 5,
    baths: 6,
    bua: 480,
    plotOrTerrace: "650 m²",
    handover: "Q1 2027",
    amenities: ["Lake Frontage", "Private Courtyard", "Triple Height Foyer"],
    subLocation: "Palm Hills New Cairo · Courtyard 5",
  },
];

// Module-level so TanStack Query can memoize the mapped result between renders
const selectPropertyItems = (res: PropertyListResponse) => res.items.map(toPropertyItem);

export function SearchWorkspace() {
  // Live catalog; the curated demo set stays on screen until it arrives or if the API is down
  const { data: liveProperties } = useQuery({
    ...propertyListQuery(),
    select: selectPropertyItems,
  });
  const properties = liveProperties?.length ? liveProperties : INITIAL_PROPERTIES;

  // Filters State - Default to full coverage so live properties appear immediately
  const [selectedLocations, setSelectedLocations] = useState<string[]>([
    "Golden Square",
    "Mivida",
    "Katameya",
    "Karmell",
    "Sidi Abd El Rahman",
  ]);
  const [maxPrice, setMaxPrice] = useState<number>(60);
  const [activePriceChip, setActivePriceChip] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "villa",
    "duplex",
    "penthouse",
    "town",
  ]);
  const [selectedHandovers, setSelectedHandovers] = useState<string[]>([
    "ready",
    "2026",
    "2027",
  ]);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([
    "Palm Hills",
    "SODIC",
    "Emaar Misr",
    "Ora Developers",
    "Katameya",
  ]);

  // View and UI State
  const [sortValue, setSortValue] = useState<string>("verified");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  // undefined = the user has not picked yet; null = the user dismissed the selection
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileFilterOpen]);

  // Default to the first listing until the user picks one, or when their pick is no
  // longer in the catalog (e.g. demo data replaced by the live catalog)
  const effectiveSelectedId =
    selectedId === null
      ? null
      : selectedId !== undefined && properties.some((p) => p.id === selectedId)
        ? selectedId
        : (properties[0]?.id ?? null);

  // Memoized selection handler to avoid child re-render churn
  const handleSelectProperty = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // Facet toggles
  const handleToggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc]
    );
  };

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const handleToggleHandover = (h: string) => {
    setSelectedHandovers((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  const handleToggleDeveloper = (dev: string) => {
    setSelectedDevelopers((prev) =>
      prev.includes(dev) ? prev.filter((item) => item !== dev) : [...prev, dev]
    );
  };

  const handlePriceChip = (chip: string) => {
    setActivePriceChip(chip);
    if (chip === "under20") setMaxPrice(20);
    if (chip === "20to35") setMaxPrice(35);
    if (chip === "35to50") setMaxPrice(50);
    if (chip === "over50") setMaxPrice(60);
  };

  const handleClearAll = () => {
    setSelectedLocations([
      "Golden Square",
      "Mivida",
      "Katameya",
      "Karmell",
      "Sidi Abd El Rahman",
    ]);
    setMaxPrice(60);
    setActivePriceChip(null);
    setSelectedTypes(["villa", "duplex", "penthouse", "town"]);
    setSelectedHandovers(["ready", "2026", "2027"]);
    setSelectedDevelopers([
      "Palm Hills",
      "SODIC",
      "Emaar Misr",
      "Ora Developers",
      "Katameya",
    ]);
  };

  // Filter and Sort Logic
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        // Location check: active only when a subset of locations is chosen
        if (
          selectedLocations.length > 0 &&
          selectedLocations.length < 5 &&
          !selectedLocations.some((loc) => p.location.toLowerCase().includes(loc.toLowerCase()))
        ) {
          return false;
        }

        // Price check (maxPrice in Millions)
        if (p.priceNum > maxPrice * 1000000) {
          return false;
        }

        // Property type check: active only when a subset of types is chosen
        if (
          selectedTypes.length > 0 &&
          selectedTypes.length < 4 &&
          !selectedTypes.includes(p.type)
        ) {
          return false;
        }

        // Developer check: active only when a subset of developers is chosen
        if (
          selectedDevelopers.length > 0 &&
          selectedDevelopers.length < 5 &&
          !selectedDevelopers.includes(p.dev)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortValue === "price-asc") return a.priceNum - b.priceNum;
        if (sortValue === "price-desc") return b.priceNum - a.priceNum;
        if (sortValue === "sqm") {
          const aSqm = parseInt(a.sqmPrice.replace(/[^0-9]/g, "")) || 0;
          const bSqm = parseInt(b.sqmPrice.replace(/[^0-9]/g, "")) || 0;
          return aSqm - bSqm;
        }
        return 0; // Default verified
      });
  }, [
    properties,
    selectedLocations,
    maxPrice,
    selectedTypes,
    selectedDevelopers,
    sortValue,
  ]);

  // Active Chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedLocations.length > 0 && selectedLocations.length < 5) {
      chips.push({
        key: "loc",
        label: `District: ${selectedLocations.join(", ")}`,
      });
    }
    if (selectedTypes.length > 0 && selectedTypes.length < 4) {
      chips.push({
        key: "type",
        label: `Type: ${selectedTypes.join(", ")}`,
      });
    }
    if (maxPrice < 60) {
      chips.push({
        key: "price",
        label: `Price: up to ${maxPrice}M EGP`,
      });
    }
    return chips;
  }, [selectedLocations, selectedTypes, maxPrice]);

  const handleRemoveChip = (key: string) => {
    if (key === "loc") {
      setSelectedLocations([
        "Golden Square",
        "Mivida",
        "Katameya",
        "Karmell",
        "Sidi Abd El Rahman",
      ]);
    }
    if (key === "type") {
      setSelectedTypes(["villa", "duplex", "penthouse", "town"]);
    }
    if (key === "price") {
      setMaxPrice(60);
      setActivePriceChip(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full">
      {/* Sub-discovery Ribbon (Tally, active chips, view switcher) */}
      <DiscoveryBar
        count={filteredProperties.length}
        activeChips={activeChips}
        onRemoveChip={handleRemoveChip}
        onClearAll={handleClearAll}
        sortValue={sortValue}
        onSortChange={setSortValue}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenFilters={() => setIsMobileFilterOpen(true)}
        activeFilterCount={activeChips.length}
      />

      {/* Main Workspace */}
      <div
        className={`search-workspace ${
          viewMode === "grid"
            ? "view-grid-only"
            : viewMode === "map"
              ? "view-map-only"
              : ""
        }`}
        id="searchWorkspace"
      >
        {/* Left Facet Rail */}
        <FacetRail
          locations={[
            { name: "Golden Square", count: 12 },
            { name: "Mivida", count: 5 },
            { name: "Katameya", count: 4 },
            { name: "Karmell", count: 6 },
            { name: "Sidi Abd El Rahman", count: 4 },
          ]}
          selectedLocations={selectedLocations}
          onToggleLocation={handleToggleLocation}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          activePriceChip={activePriceChip}
          onSelectPriceChip={handlePriceChip}
          types={[
            { id: "villa", name: "Standalone Villa", count: 10 },
            { id: "duplex", name: "Sky Villa & Duplex", count: 8 },
            { id: "penthouse", name: "Penthouse", count: 4 },
            { id: "town", name: "Twin & Townhouse", count: 6 },
          ]}
          selectedTypes={selectedTypes}
          onToggleType={handleToggleType}
          handovers={[
            { id: "ready", name: "Ready to Move (Immediate)", count: 9 },
            { id: "2026", name: "2026 Delivery", count: 11 },
            { id: "2027", name: "2027 New Launches", count: 5 },
          ]}
          selectedHandovers={selectedHandovers}
          onToggleHandover={handleToggleHandover}
          developers={[
            { name: "Palm Hills", count: 8 },
            { name: "SODIC", count: 6 },
            { name: "Emaar Misr", count: 5 },
            { name: "Ora Developers", count: 3 },
          ]}
          selectedDevelopers={selectedDevelopers}
          onToggleDeveloper={handleToggleDeveloper}
        />

        {/* Center Property Stream */}
        <PropertyStream
          properties={filteredProperties}
          selectedId={effectiveSelectedId}
          onHoverProperty={handleSelectProperty}
          onClickProperty={handleSelectProperty}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onClearAll={handleClearAll}
        />

        {/* Right Map Discovery Column */}
        <DynamicSearchMap
          properties={filteredProperties}
          selectedId={effectiveSelectedId}
          onSelectProperty={handleSelectProperty}
          isMapOnlyMode={viewMode === "map"}
        />
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div
          className="mobile-facet-drawer-overlay"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className="mobile-facet-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filter residences"
          >
            <div className="mobile-facet-header">
              <h2>Filters & Criteria</h2>
              <div className="mobile-facet-actions">
                {activeChips.length > 0 && (
                  <button
                    type="button"
                    className="mobile-facet-reset"
                    onClick={handleClearAll}
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  className="mobile-facet-close"
                  aria-label="Close filters"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mobile-facet-scroll">
              <FacetRail
                locations={[
                  { name: "Golden Square", count: 12 },
                  { name: "Mivida", count: 5 },
                  { name: "Katameya", count: 4 },
                  { name: "Karmell", count: 6 },
                  { name: "Sidi Abd El Rahman", count: 4 },
                ]}
                selectedLocations={selectedLocations}
                onToggleLocation={handleToggleLocation}
                maxPrice={maxPrice}
                onMaxPriceChange={setMaxPrice}
                activePriceChip={activePriceChip}
                onSelectPriceChip={handlePriceChip}
                types={[
                  { id: "villa", name: "Standalone Villa", count: 10 },
                  { id: "duplex", name: "Sky Villa & Duplex", count: 8 },
                  { id: "penthouse", name: "Penthouse", count: 4 },
                  { id: "town", name: "Twin & Townhouse", count: 6 },
                ]}
                selectedTypes={selectedTypes}
                onToggleType={handleToggleType}
                handovers={[
                  { id: "ready", name: "Ready to Move (Immediate)", count: 9 },
                  { id: "2026", name: "2026 Delivery", count: 11 },
                  { id: "2027", name: "2027 New Launches", count: 5 },
                ]}
                selectedHandovers={selectedHandovers}
                onToggleHandover={handleToggleHandover}
                developers={[
                  { name: "Palm Hills", count: 8 },
                  { name: "SODIC", count: 6 },
                  { name: "Emaar Misr", count: 5 },
                  { name: "Ora Developers", count: 3 },
                ]}
                selectedDevelopers={selectedDevelopers}
                onToggleDeveloper={handleToggleDeveloper}
              />
            </div>

            <div className="mobile-facet-footer">
              <button
                type="button"
                className="mobile-facet-apply-btn"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Show {filteredProperties.length} Verified Residences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
