"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Share2,
  Heart,
  Scale,
  FileDown,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sliders,
  PhoneCall,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import "./property-detail.css";

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  isCover?: boolean;
}

export interface PropertyAmenity {
  id: string;
  nameEn: string;
  nameAr?: string | null;
  category: string;
  icon?: string | null;
}

export interface PropertyDetailData {
  id: string;
  slug: string;
  titleEn: string;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  propertyType: string;
  listingIntent: string;
  price: number; // in EGP
  currency: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  landAreaSqm?: number;
  developer?: string;
  project?: string;
  areaName?: string;
  district?: string;
  referenceCode?: string;
  finishingType?: string;
  deliveryYear?: number;
  latitude: number;
  longitude: number;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  agent?: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
    licenseNumber?: string;
    brokerageName?: string;
    dealsCount?: number;
  };
}

interface PropertyDetailClientProps {
  initialProperty?: PropertyDetailData;
}

// Authentic Egyptian luxury fallback showcase villa (Lake View Signature Villa)
const DEFAULT_PROPERTY: PropertyDetailData = {
  id: "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
  slug: "lake-view-signature-villa-sett-nc-9042",
  titleEn: "Lake View Signature Villa",
  titleAr: "فيلا ليك فيو الفاخرة",
  descriptionEn:
    "An architectural masterpiece nestled in the prestigious Golden Square enclave of New Cairo. Spanning 540 m² of meticulously crafted built-up area on a private 720 m² landscaped plot, this residence redefines contemporary Egyptian luxury. Features triple-height double reception halls, imported Italian Statuario marble floors, bespoke walnut paneling, and expansive floor-to-ceiling Schuco glazing opening directly onto a private infinity lap pool and sunken fire-pit lounge. The master wing occupies an entire private pavilion with twin dressing salons, an en-suite wellness sanctuary, and an elevated terrace overlooking tranquil water features.",
  propertyType: "VILLA",
  listingIntent: "SALE",
  price: 32500000,
  currency: "EGP",
  bedrooms: 5,
  bathrooms: 6,
  areaSqm: 540,
  landAreaSqm: 720,
  developer: "Palm Hills Developments",
  project: "Lake View Residence",
  areaName: "New Cairo",
  district: "Golden Square, Zone A",
  referenceCode: "SET-NC-9042",
  finishingType: "Fully Finished — Ultra Luxury",
  deliveryYear: 2026,
  latitude: 30.0155,
  longitude: 31.488,
  images: [
    { id: "img-1", url: "/images/1.jpg", isCover: true },
    { id: "img-2", url: "/images/3.jpg" },
    { id: "img-3", url: "/images/4.jpg" },
    { id: "img-4", url: "/images/7.jpg" },
    { id: "img-5", url: "/images/2.jpg" },
    { id: "img-6", url: "/images/5.jpg" },
    { id: "img-7", url: "/images/8.jpg" },
  ],
  amenities: [
    { id: "a-1", nameEn: "Private Heated Infinity Pool", category: "WELLNESS", icon: "Waves" },
    { id: "a-2", nameEn: "Integrated Crestron Smart Home", category: "SECURITY", icon: "Cpu" },
    { id: "a-3", nameEn: "Sub-Zero & Wolf Show Kitchen", category: "FINISHES", icon: "UtensilsCrossed" },
    { id: "a-4", nameEn: "Private 3-Bay Covered Garage with EV Fast Charger", category: "INFRASTRUCTURE", icon: "Car" },
    { id: "a-5", nameEn: "Independent Maid & Driver Quarters", category: "SERVICE", icon: "Home" },
    { id: "a-6", nameEn: "Private Elevators Across All Levels", category: "INFRASTRUCTURE", icon: "ArrowUpDown" },
    { id: "a-7", nameEn: "Italian Statuario Marble Flooring", category: "FINISHES", icon: "Gem" },
    { id: "a-8", nameEn: "German Schüco Thermal-Break Acoustic Windows", category: "FINISHES", icon: "Shield" },
    { id: "a-9", nameEn: "24/7 Gated Perimeter Security & CCTV", category: "SECURITY", icon: "Lock" },
    { id: "a-10", nameEn: "Landscaped Garden with Automated Irrigation", category: "WELLNESS", icon: "Trees" },
    { id: "a-11", nameEn: "Backup Solar Power & Silent Generator", category: "INFRASTRUCTURE", icon: "Zap" },
    { id: "a-12", nameEn: "Daikin VRV Central Inverter Air Conditioning", category: "COMFORT", icon: "Wind" },
  ],
  agent: {
    id: "agent-01",
    name: "Karim El-Sayed",
    email: "karim.elsayed@settly.ai",
    image: "/images/phone.jpg",
    licenseNumber: "EG-LIC-78921",
    brokerageName: "Senior Palm Hills Advisor · 64 Deals",
    dealsCount: 64,
  },
};

export function PropertyDetailClient({ initialProperty }: PropertyDetailClientProps) {
  const property = initialProperty || DEFAULT_PROPERTY;

  // Active Main Photo in Gallery
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(
    property.images[0]?.url || "/images/1.jpg"
  );

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Favorite State
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payment Calculator State
  const [downPaymentPct, setDownPaymentPct] = useState(10);
  const basePrice = property.price || 32500000;

  const downPaymentAmount = useMemo(() => {
    return (basePrice * downPaymentPct) / 100;
  }, [basePrice, downPaymentPct]);

  const quarterlyInstallment = useMemo(() => {
    const remaining = basePrice - downPaymentAmount;
    return Math.round(remaining / 28); // 7 years = 28 quarters
  }, [basePrice, downPaymentAmount]);

  // Floorplan Tabs State
  const [activeFloor, setActiveFloor] = useState<"ground" | "first" | "roof">("ground");

  // Scheduler State
  const [selectedDay, setSelectedDay] = useState<number>(12);
  const [selectedTime, setSelectedTime] = useState<string>("02:00 PM");
  const [bookingToast, setBookingToast] = useState(false);

  // Lightbox keyboard controls
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev + 1) % property.images.length);
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, property.images.length]);

  const openLightboxAt = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleBookingClick = () => {
    setBookingToast(true);
    setTimeout(() => setBookingToast(false), 4000);
  };

  const pricePerSqm = useMemo(() => {
    if (!property.areaSqm || property.areaSqm <= 0) return 0;
    return Math.round(basePrice / property.areaSqm);
  }, [basePrice, property.areaSqm]);

  const floorData = {
    ground: {
      name: "Ground Floor",
      area: "240 m²",
      rooms: [
        { name: "Grand Reception & Salon", area: "96.8 m²" },
        { name: "Dining Salon", area: "24.5 m²" },
        { name: "Show Kitchen & Pantry", area: "18.2 m²" },
        { name: "Guest Bedroom (En-suite)", area: "25.0 m²" },
        { name: "Powder Room & Vestibule", area: "8.4 m²" },
        { name: "Covered Loggia & Pool Terrace", area: "48.0 m²" },
      ],
    },
    first: {
      name: "First Floor",
      area: "210 m²",
      rooms: [
        { name: "Master Bedroom Pavilion", area: "42.0 m²" },
        { name: "Twin Walk-in Dressing Salons", area: "14.5 m²" },
        { name: "Suite 2 (Private Bath & Balcony)", area: "26.4 m²" },
        { name: "Suite 3 (Private Bath)", area: "24.8 m²" },
        { name: "Suite 4 (Private Bath)", area: "22.0 m²" },
        { name: "Family Living & Library Lounge", area: "38.5 m²" },
      ],
    },
    roof: {
      name: "Penthouse Roof",
      area: "90 m²",
      rooms: [
        { name: "Sky Lounge & Cocktail Bar", area: "36.0 m²" },
        { name: "Open Panorama Sky Deck", area: "78.5 m²" },
        { name: "Outdoor Summer Kitchenette / BBQ", area: "12.0 m²" },
        { name: "Powder Room & Storage", area: "6.5 m²" },
      ],
    },
  };

  // Grouped amenities
  const groupedAmenities = useMemo(() => {
    const groups: { [key: string]: PropertyAmenity[] } = {};
    property.amenities.forEach((a) => {
      const cat = a.category || "GENERAL";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [property.amenities]);

  return (
    <div className="property-detail-page selection:bg-brass-200 selection:text-navy-950">
      <Navbar />

      {/* Sub-header Breadcrumb Bar */}
      <section className="breadcrumb-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="breadcrumb-row">
            <nav className="breadcrumb-trail" aria-label="Breadcrumb">
              <Link href="/">Settly</Link>
              <span className="sep">/</span>
              <Link href="/search">Properties</Link>
              <span className="sep">/</span>
              <Link href="/areas/new-cairo">{property.areaName || "New Cairo"}</Link>
              <span className="sep">/</span>
              <span className="current">{property.titleEn}</span>
            </nav>

            <div className="detail-actions-cluster">
              <button
                type="button"
                onClick={handleCopyLink}
                className="cluster-btn"
                title="Copy property link"
              >
                <Share2 className="w-3.5 h-3.5 text-navy-900" />
                <span>{copiedLink ? "✓ Link Copied" : "Share"}</span>
              </button>

              <Link
                href={`/compare?id=${property.id}`}
                className="cluster-btn"
                title="Compare with other units"
              >
                <Scale className="w-3.5 h-3.5 text-navy-900" />
                <span>Compare</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsFavorited(!isFavorited)}
                className={`cluster-btn ${isFavorited ? "favorited" : ""}`}
                title={isFavorited ? "Saved to favorites" : "Save to favorites"}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${isFavorited ? "fill-current text-red-600" : "text-navy-900"}`}
                />
                <span>{isFavorited ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="cluster-btn hidden sm:inline-flex"
                title="Print or save PDF brochure"
              >
                <FileDown className="w-3.5 h-3.5 text-navy-900" />
                <span>Brochure</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Architectural Gallery Stage */}
      <section className="gallery-stage">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="gallery-grid">
            {/* Main Primary Viewport */}
            <div
              className="gallery-main group"
              onClick={() => openLightboxAt(0)}
              role="button"
              tabIndex={0}
              aria-label="Enlarge main photo"
            >
              <Image
                src={activePhotoUrl}
                alt={property.titleEn}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Side 4-Thumbnail Grid */}
            <div className="gallery-side">
              {property.images.slice(1, 5).map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="gallery-thumb group"
                  onClick={() => setActivePhotoUrl(img.url)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View photo ${idx + 2}`}
                >
                  <Image
                    src={img.url}
                    alt={`${property.titleEn} - View ${idx + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle active border indicator */}
                  {activePhotoUrl === img.url && (
                    <div className="absolute inset-0 ring-2 ring-brass ring-inset z-10 pointer-events-none" />
                  )}
                </div>
              ))}
            </div>

            {/* Floating Triggers */}
            <div className="gallery-floating-triggers">
              <button
                type="button"
                onClick={() => openLightboxAt(0)}
                className="gallery-trigger-btn"
              >
                <Layers className="w-3.5 h-3.5 text-brass" />
                <span>View all {property.images.length} Photos</span>
              </button>
              <button
                type="button"
                onClick={() => alert("3D Virtual Reality Tour loading from Matterport engine.")}
                className="gallery-trigger-btn hidden sm:inline-flex"
              >
                <Sparkles className="w-3.5 h-3.5 text-brass" />
                <span>3D Virtual Tour</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Detail Workspace */}
      <main className="detail-workspace flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="detail-layout">
            {/* ===============================================================
                 LEFT MAIN COLUMN (Architecture, Specs, Schedule & Legal)
                 =============================================================== */}
            <div className="detail-main-col">
              {/* Property Identity Header Card */}
              <div className="prop-header-card">
                <div className="prop-badges-row">
                  <span className="badge-dev">{property.developer || "Developer Allocation"}</span>
                  <span className="badge-verified">
                    <CheckCircle2 className="w-3 h-3 text-sage" />
                    100% Freehold · CAD Audited
                  </span>
                  <span className="badge-ref">Ref: {property.referenceCode || "SET-NC-9042"}</span>
                </div>

                <h1 className="prop-headline-h1">{property.titleEn}</h1>

                <div className="prop-loc-subtitle">
                  <MapPin className="w-4 h-4 text-brass shrink-0" />
                  <span>
                    {property.project ? `${property.project} · ` : ""}
                    {property.district ? `${property.district}, ` : ""}
                    {property.areaName || "New Cairo"}
                  </span>
                </div>

                <div className="prop-price-stage">
                  <div>
                    <div className="prop-price-big">
                      {basePrice.toLocaleString("en-US")}
                      <small>EGP</small>
                    </div>
                    <div className="text-xs font-mono text-ink-3 mt-1">
                      Official Master Developer Contract Price · 0% Agency Surcharge
                    </div>
                  </div>
                  {pricePerSqm > 0 && (
                    <div className="prop-unit-sqm">
                      EGP {pricePerSqm.toLocaleString("en-US")} / m² BUA
                    </div>
                  )}
                </div>
              </div>

              {/* 6-Metric Dimensional Grid */}
              <div className="matrix-grid">
                <div className="matrix-card">
                  <div className="matrix-val">{property.areaSqm} m²</div>
                  <div className="matrix-lbl">Built-Up Area (BUA)</div>
                  <div className="matrix-sub">Verified internal footprint</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.landAreaSqm || 720} m²</div>
                  <div className="matrix-lbl">Land / Plot Area</div>
                  <div className="matrix-sub">Private landscaped garden</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bedrooms} Suites</div>
                  <div className="matrix-lbl">Bedrooms</div>
                  <div className="matrix-sub">All en-suite with walk-in dressing</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bathrooms} Baths</div>
                  <div className="matrix-lbl">Bathrooms</div>
                  <div className="matrix-sub">Plus guest powder room</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">3 Bays</div>
                  <div className="matrix-lbl">Covered Parking</div>
                  <div className="matrix-sub">EV fast-charger pre-wired</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">G + 1 + Roof</div>
                  <div className="matrix-lbl">Building Levels</div>
                  <div className="matrix-sub">90 m² sky lounge & terrace</div>
                </div>
              </div>

              {/* Architectural Overview Narrative */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Architectural Overview & Layout</span>
                  <span className="text-xs font-mono font-medium text-ink-3">
                    Finishing: {property.finishingType || "Ultra Luxury"}
                  </span>
                </h2>
                <div className="text-sm text-ink-2 leading-relaxed space-y-4 font-sans">
                  <p>{property.descriptionEn || DEFAULT_PROPERTY.descriptionEn}</p>
                </div>
              </div>

              {/* Curated Amenities Grid */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Curated Amenities & Specifications</span>
                  <span className="text-xs font-mono font-medium text-brass-600">
                    {property.amenities.length} Verified Items
                  </span>
                </h2>

                <div className="space-y-6">
                  {Object.entries(groupedAmenities).map(([category, items]) => (
                    <div key={category} className="amenities-category-group">
                      <div className="amenities-category-title">{category}</div>
                      <div className="amenities-chips-grid">
                        {items.map((amenity) => (
                          <div key={amenity.id} className="amenity-chip">
                            <ShieldCheck className="w-4 h-4 text-brass shrink-0" />
                            <span>{amenity.nameEn}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Architecture & Payment Breakdown */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Financial Architecture & Payment Plan</span>
                  <span className="text-xs font-mono font-bold text-brass-600">
                    7-Year Developer Plan
                  </span>
                </h2>

                <div className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                  Direct allocation contract through {property.developer || "Developer"}. Backed by
                  Central Bank of Egypt audited escrow account with full title-deed registration upon
                  final installment.
                </div>

                {/* Visual Progress Track */}
                <div className="finance-progression-bar" title="Payment Schedule Breakdown">
                  <div className="prog-seg-down" title="10% Down Payment" />
                  <div className="prog-seg-inst" title="70% Equal Quarterly Installments" />
                  <div className="prog-seg-maint" title="8% Maintenance on Delivery" />
                  <div className="prog-seg-final" title="12% Final Handover Balloon" />
                </div>

                <div className="overflow-x-auto">
                  <table className="finance-schedule-table">
                    <thead>
                      <tr>
                        <th>Milestone</th>
                        <th>Percentage</th>
                        <th>Amount (EGP)</th>
                        <th>Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <b>Reservation & Contract Signing</b>
                        </td>
                        <td>10.0%</td>
                        <td>{(basePrice * 0.1).toLocaleString("en-US")}</td>
                        <td>Immediate on agreement</td>
                      </tr>
                      <tr>
                        <td>
                          <b>28 Equal Quarterly Installments</b>
                        </td>
                        <td>70.0%</td>
                        <td>
                          {Math.round((basePrice * 0.7) / 28).toLocaleString("en-US")}{" "}
                          <small className="text-ink-3">/ quarter</small>
                        </td>
                        <td>Every 90 days over 7 years</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Maintenance Reserve Deposit</b>
                        </td>
                        <td>8.0%</td>
                        <td>{(basePrice * 0.08).toLocaleString("en-US")}</td>
                        <td>Upon key handover ({property.deliveryYear || 2026})</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Handover & Title Delivery</b>
                        </td>
                        <td>12.0%</td>
                        <td>{(basePrice * 0.12).toLocaleString("en-US")}</td>
                        <td>On delivery inspection</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Reactive Down Payment Calculator */}
                <div className="calc-box">
                  <div className="calc-head">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brass" />
                      <span>Interactive Payment Scenario Simulator</span>
                    </span>
                    <span className="text-brass font-mono">
                      Down Payment: {downPaymentPct}% ({downPaymentAmount.toLocaleString("en-US")}{" "}
                      EGP)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="30"
                    step="5"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                    className="calc-slider"
                  />

                  <div className="calc-readout-row">
                    <div className="calc-readout-item">
                      <span>Initial Down Payment</span>
                      <b>{downPaymentAmount.toLocaleString("en-US")} EGP</b>
                    </div>
                    <div className="calc-readout-item">
                      <span>Quarterly Installment (28 Qtrs)</span>
                      <b>{quarterlyInstallment.toLocaleString("en-US")} EGP</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Floorplans Section */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Architectural Floorplans (CAD Verified)</span>
                  <span className="text-xs font-mono font-bold text-sage">
                    DWG Stamp #EG-2024-88
                  </span>
                </h2>

                <div className="floor-tab-bar" role="tablist">
                  <button
                    type="button"
                    onClick={() => setActiveFloor("ground")}
                    className={`floor-tab-btn ${activeFloor === "ground" ? "active" : ""}`}
                  >
                    Ground Floor (240 m²)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFloor("first")}
                    className={`floor-tab-btn ${activeFloor === "first" ? "active" : ""}`}
                  >
                    First Floor (210 m²)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFloor("roof")}
                    className={`floor-tab-btn ${activeFloor === "roof" ? "active" : ""}`}
                  >
                    Penthouse Roof (90 m²)
                  </button>
                </div>

                <div className="floor-plan-view-box">
                  {/* CAD Blueprint SVG */}
                  <svg
                    className="cad-blueprint-svg"
                    viewBox="0 0 600 380"
                    aria-label="CAD Architectural Blueprint"
                  >
                    {/* Outer Boundary */}
                    <rect
                      x="30"
                      y="20"
                      width="540"
                      height="340"
                      rx="6"
                      fill="#FDFDFB"
                      stroke="#131D36"
                      strokeWidth="2.5"
                    />
                    <rect
                      x="36"
                      y="26"
                      width="528"
                      height="328"
                      rx="4"
                      fill="none"
                      stroke="rgba(30, 42, 74, 0.18)"
                      strokeDasharray="4,4"
                    />

                    {/* Dividing walls */}
                    <line x1="280" y1="20" x2="280" y2="360" stroke="#1E2A4A" strokeWidth="2" />
                    <line x1="280" y1="180" x2="570" y2="180" stroke="#1E2A4A" strokeWidth="2" />
                    <line x1="30" y1="200" x2="280" y2="200" stroke="#1E2A4A" strokeWidth="2" />

                    {/* Room blocks */}
                    <rect x="36" y="26" width="240" height="170" fill="rgba(198, 151, 73, 0.08)" />
                    <text
                      x="55"
                      y="70"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                      fontSize="13"
                      fill="#131D36"
                    >
                      {activeFloor === "ground"
                        ? "Double Reception & Salon"
                        : activeFloor === "first"
                        ? "Master Suite Pavilion"
                        : "Sky Lounge & Cocktail Bar"}
                    </text>
                    <text
                      x="55"
                      y="92"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fill="#646D88"
                    >
                      {activeFloor === "ground"
                        ? "11.8m × 8.2m (96.8 m²)"
                        : activeFloor === "first"
                        ? "8.4m × 5.0m (42.0 m²)"
                        : "6.0m × 6.0m (36.0 m²)"}
                    </text>

                    <rect
                      x="285"
                      y="26"
                      width="280"
                      height="150"
                      fill="rgba(61, 90, 76, 0.08)"
                    />
                    <text
                      x="305"
                      y="70"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                      fontSize="13"
                      fill="#131D36"
                    >
                      {activeFloor === "ground"
                        ? "Guest Suite (En-suite)"
                        : activeFloor === "first"
                        ? "Suite 2 & Private Balcony"
                        : "Outdoor Summer Deck & BBQ"}
                    </text>
                    <text
                      x="305"
                      y="92"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fill="#646D88"
                    >
                      {activeFloor === "ground"
                        ? "5.2m × 4.8m (25.0 m²)"
                        : activeFloor === "first"
                        ? "5.5m × 4.8m (26.4 m²)"
                        : "9.8m × 8.0m (78.5 m²)"}
                    </text>

                    <text
                      x="55"
                      y="245"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                      fontSize="13"
                      fill="#131D36"
                    >
                      {activeFloor === "ground"
                        ? "Show Kitchen & Dining"
                        : activeFloor === "first"
                        ? "Family Living & Library"
                        : "Mechanical & Storage"}
                    </text>
                    <text
                      x="55"
                      y="267"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fill="#646D88"
                    >
                      {activeFloor === "ground"
                        ? "6.4m × 5.8m (37.1 m²)"
                        : activeFloor === "first"
                        ? "7.0m × 5.5m (38.5 m²)"
                        : "4.0m × 3.0m (12.0 m²)"}
                    </text>

                    <rect
                      x="285"
                      y="185"
                      width="280"
                      height="170"
                      fill="rgba(19, 29, 54, 0.04)"
                    />
                    <text
                      x="305"
                      y="235"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                      fontSize="13"
                      fill="#131D36"
                    >
                      {activeFloor === "ground"
                        ? "Covered Loggia & Pool Front"
                        : activeFloor === "first"
                        ? "Suite 3 & Suite 4 Pavilions"
                        : "Open Sky Deck Vista"}
                    </text>
                    <text
                      x="305"
                      y="257"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fill="#646D88"
                    >
                      {activeFloor === "ground"
                        ? "Direct Pool Frontage (48.0 m²)"
                        : activeFloor === "first"
                        ? "En-suite Bathrooms (46.8 m²)"
                        : "Unobstructed Lake View"}
                    </text>
                  </svg>

                  {/* Room measurements list */}
                  <div className="floor-rooms-list">
                    {floorData[activeFloor].rooms.map((room, idx) => (
                      <div key={idx} className="room-item">
                        <span>{room.name}:</span>
                        <b>{room.area}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Location Context & Commute Telemetry */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Location Context & District Map</span>
                  <span className="text-xs font-mono text-ink-3">
                    {property.latitude.toFixed(4)}°N {property.longitude.toFixed(4)}°E
                  </span>
                </h2>

                {/* Map Preview Canvas */}
                <div className="detail-map-canvas relative group overflow-hidden">
                  <Image
                    src="/images/panoramic.jfif"
                    alt="Cairo Golden Square Satellite Overview"
                    fill
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px]" />

                  {/* Center Location Pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-brass border-2 border-white flex items-center justify-center text-navy-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <MapPin className="w-5 h-5 fill-current" />
                    </div>
                    <div className="mt-2 px-3 py-1 bg-navy-900/95 text-white text-xs font-mono font-bold rounded-md shadow-md border border-white/20 whitespace-nowrap">
                      {property.project || "Lake View Residence"}
                    </div>
                  </div>

                  {/* Top-Right Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-white/90 backdrop-blur text-[11px] font-mono font-semibold text-navy-900 border border-line">
                    GIS Satellite Matrix
                  </div>
                </div>

                {/* Commute Telemetry Cards */}
                <div className="commute-cards-grid">
                  <div className="commute-card">
                    <div className="commute-time">4 mins</div>
                    <div className="commute-place">Dusit Thani LakeView</div>
                  </div>
                  <div className="commute-card">
                    <div className="commute-time">8 mins</div>
                    <div className="commute-place">AUC New Cairo Campus</div>
                  </div>
                  <div className="commute-card">
                    <div className="commute-time">12 mins</div>
                    <div className="commute-place">Cairo Festival City</div>
                  </div>
                  <div className="commute-card">
                    <div className="commute-time">18 mins</div>
                    <div className="commute-place">Cairo Int&apos;l Airport</div>
                  </div>
                </div>
              </div>

              {/* Title Deed & Legal Audit Dossier */}
              <div className="detail-card">
                <h2 className="detail-card-title">
                  <span>Title Deed & Legal Audit Dossier</span>
                  <span className="text-xs font-mono font-bold text-sage">NUCA Verified</span>
                </h2>

                <div className="legal-check-list">
                  <div className="legal-item">
                    <CheckCircle2 className="legal-icon w-5 h-5 text-sage shrink-0" />
                    <div className="legal-text">
                      <b>Official Land Registry Number #49281</b>
                      <span>Recorded with the Real Estate Publicity Department (Al Shahr Al Aqari).</span>
                    </div>
                  </div>

                  <div className="legal-item">
                    <CheckCircle2 className="legal-icon w-5 h-5 text-sage shrink-0" />
                    <div className="legal-text">
                      <b>Construction License #184/2023</b>
                      <span>Authorized by New Urban Communities Authority (NUCA) with 0 height violations.</span>
                    </div>
                  </div>

                  <div className="legal-item">
                    <CheckCircle2 className="legal-icon w-5 h-5 text-sage shrink-0" />
                    <div className="legal-text">
                      <b>Bank Escrow Account Protected</b>
                      <span>Installments disbursed strictly against surveyed construction milestones.</span>
                    </div>
                  </div>

                  <div className="legal-item">
                    <CheckCircle2 className="legal-icon w-5 h-5 text-sage shrink-0" />
                    <div className="legal-text">
                      <b>Zero Overdue Maintenance Fees</b>
                      <span>Clean developer audit sheet with zero outstanding developer debt.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===============================================================
                 RIGHT STICKY COLUMN (Action Console, Viewing & Broker)
                 =============================================================== */}
            <aside className="detail-sticky-col">
              <div className="action-console-card">
                <span className="console-status-pill">Available · Direct Allocation</span>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-sans text-ink-3">Contract Price:</span>
                  <b className="font-mono text-2xl font-bold text-navy-900">
                    {basePrice.toLocaleString("en-US")} EGP
                  </b>
                </div>

                {/* Viewing Scheduler Box */}
                <div className="viewing-scheduler-box">
                  <div className="sched-header">
                    <span className="sched-month">March 2026</span>
                    <span className="text-xs font-mono text-ink-3">Private Tour</span>
                  </div>

                  <div className="sched-calendar-grid">
                    <div className="sched-dow">M</div>
                    <div className="sched-dow">T</div>
                    <div className="sched-dow">W</div>
                    <div className="sched-dow">T</div>
                    <div className="sched-dow">F</div>
                    <div className="sched-dow">S</div>
                    <div className="sched-dow">S</div>

                    <button type="button" className="sched-day disabled">9</button>
                    <button type="button" className="sched-day disabled">10</button>
                    <button type="button" className="sched-day disabled">11</button>
                    {[12, 13, 14, 15].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`sched-day ${selectedDay === d ? "selected" : ""}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {/* Time Chips */}
                  <div className="time-chips-row">
                    {["10:30 AM", "02:00 PM", "04:30 PM"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`time-chip ${selectedTime === t ? "active" : ""}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Booking Button */}
                <button
                  type="button"
                  onClick={handleBookingClick}
                  className="btn-submit-offer !bg-brass !text-navy-950 hover:!bg-brass-600 hover:!text-white font-semibold"
                >
                  <Calendar className="w-4 h-4" />
                  <span>
                    {bookingToast
                      ? `✓ Viewing Confirmed (Mar ${selectedDay} @ ${selectedTime})`
                      : "Schedule Private Viewing"}
                  </span>
                </button>

                {/* Direct WhatsApp Ingestion */}
                <a
                  href={`https://wa.me/201000000000?text=${encodeURIComponent(
                    `I am interested in acquiring ${property.titleEn} (Ref: ${
                      property.referenceCode || "SET-NC-9042"
                    }) listed on Settly.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-inquire-whatsapp"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Instant WhatsApp Ingestion</span>
                </a>

                {/* Make Binding Escrow Offer */}
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Settly Sovereign Escrow: To place a binding allocation offer, please complete identity verification."
                    )
                  }
                  className="btn-submit-offer"
                >
                  <span>Submit Escrow Offer</span>
                </button>

                {/* Licensed Advisor Representation Card */}
                {property.agent && (
                  <div className="agent-advisor-box">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-brass flex-shrink-0 bg-canvas-2">
                      <Image
                        src={property.agent.image || "/images/phone.jpg"}
                        alt={property.agent.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="advisor-info min-w-0">
                      <b className="truncate">{property.agent.name}</b>
                      <span className="truncate block">
                        {property.agent.brokerageName || "Senior Palm Hills Advisor · 64 Deals"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Similar Verified Residences */}
      <section className="similar-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-navy-900">
                Similar Verified Residences
              </h2>
              <p className="text-sm text-ink-3 mt-1 font-sans">
                Comparable units in Golden Square and Sheikh Zayed with active installment terms.
              </p>
            </div>
            <Link
              href="/search"
              className="text-xs font-mono font-semibold text-navy-900 hover:text-brass transition-colors inline-flex items-center gap-1"
            >
              Explore all 24 units <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="similar-grid">
            {/* Similar 1: Mivida Crescent Standalone */}
            <Link href="/properties/mivida-crescent-standalone" className="prop-card group">
              <div className="prop-card-media">
                <Image
                  src="/images/7.jpg"
                  alt="Mivida Crescent Standalone"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="prop-card-tags">
                  <span className="tag-dev">Emaar Misr</span>
                  <span className="tag-ok">Verified</span>
                </div>
                <span className="prop-card-sqm">EGP 78,225 / m²</span>
              </div>
              <div className="prop-card-body">
                <span className="prop-card-loc">Golden Square, New Cairo</span>
                <h3 className="prop-card-title">Mivida Crescent Standalone</h3>
                <div className="prop-card-price">
                  48,500,000<small>EGP</small>
                </div>
                <div className="prop-card-specs">6 Beds · 7 Baths · 620 m²</div>
              </div>
            </Link>

            {/* Similar 2: Villette Sky Villa */}
            <Link href="/properties/villette-sky-villa" className="prop-card group">
              <div className="prop-card-media">
                <Image
                  src="/images/2.jpg"
                  alt="Villette Sky Villa"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="prop-card-tags">
                  <span className="tag-dev">Sodic</span>
                  <span className="tag-ok">Verified</span>
                </div>
                <span className="prop-card-sqm">EGP 56,120 / m²</span>
              </div>
              <div className="prop-card-body">
                <span className="prop-card-loc">Eastown District, New Cairo</span>
                <h3 className="prop-card-title">Villette Sky Villa Duplex</h3>
                <div className="prop-card-price">
                  19,800,000<small>EGP</small>
                </div>
                <div className="prop-card-specs">4 Beds · 4 Baths · 340 m²</div>
              </div>
            </Link>

            {/* Similar 3: Badya Grand Standalone */}
            <Link href="/properties/badya-grand-standalone" className="prop-card group">
              <div className="prop-card-media">
                <Image
                  src="/images/4.jpg"
                  alt="Badya Grand Standalone"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="prop-card-tags">
                  <span className="tag-dev">Palm Hills</span>
                  <span className="tag-ok">Verified</span>
                </div>
                <span className="prop-card-sqm">EGP 52,800 / m²</span>
              </div>
              <div className="prop-card-body">
                <span className="prop-card-loc">Creative City, 6th of October</span>
                <h3 className="prop-card-title">Badya Grand Standalone Villa</h3>
                <div className="prop-card-price">
                  26,400,000<small>EGP</small>
                </div>
                <div className="prop-card-specs">5 Beds · 5 Baths · 500 m²</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer Concierge Strip */}
      <section className="pre-ftr-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pre-ftr-row">
            <div className="pre-ftr-text">
              <h3>Direct Developer Fiduciary Advisory</h3>
              <p>
                Need assistance with developer allocations, title deed verification, or custom payment
                terms? Our private client desk is active 7 days a week.
              </p>
            </div>
            <div className="pre-ftr-actions">
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pre-whatsapp"
              >
                <ExternalLink className="w-4 h-4" />
                <span>WhatsApp Private Desk</span>
              </a>
              <Link href="/agents" className="btn-pre-advisor">
                <PhoneCall className="w-4 h-4" />
                <span>Speak to an Advisor</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-modal" role="dialog" aria-modal="true">
          <div className="lightbox-hdr">
            <span className="lightbox-counter">
              Photo {lightboxIndex + 1} of {property.images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="lightbox-close-btn"
            >
              Close [ESC]
            </button>
          </div>

          <div className="lightbox-viewport">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex(
                  (prev) => (prev - 1 + property.images.length) % property.images.length
                )
              }
              className="lightbox-nav-btn lightbox-prev"
              aria-label="Previous photo"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={property.images[lightboxIndex]?.url || "/images/1.jpg"}
                alt={`${property.titleEn} photo ${lightboxIndex + 1}`}
                width={1400}
                height={900}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev + 1) % property.images.length)
              }
              className="lightbox-nav-btn lightbox-next"
              aria-label="Next photo"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
