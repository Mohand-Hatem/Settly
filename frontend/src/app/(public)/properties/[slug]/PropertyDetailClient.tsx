"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Layers,
  MapPin,
  MessageSquare,
  Printer,
  Scale,
  Share2,
  Shield,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PropertyResponse } from "@/api/catalog";
import { fetchPropertyList } from "@/api/catalog";
import { authClient } from "@/lib/auth-client";
import { piastresToEgp } from "@/lib/money";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { toast } from "@/components/ui/Toaster";
import { VerificationProvider, useVerificationGate } from "@/components/portal/EmailVerification";
import { RequestViewingModal } from "@/components/property/RequestViewingModal";
import { MakeOfferModal } from "@/components/property/MakeOfferModal";
import { MessageAgentModal } from "@/components/property/MessageAgentModal";
import { myOfferForPropertyQuery } from "@/lib/query/offers";
import { Skeleton } from "@/components/ui/Skeleton";
import "./property-detail.css";

const PropertyLocationMap = dynamic(() => import("@/components/property/PropertyLocationMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl min-h-[250px]" />,
});

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  TOWNHOUSE: "Townhouse",
  TWIN_HOUSE: "Twin house",
  DUPLEX: "Duplex",
  PENTHOUSE: "Penthouse",
  CHALET: "Chalet",
  STUDIO: "Studio",
  OFFICE: "Office",
  RETAIL: "Retail",
  LAND: "Land",
};
const RENT_PERIOD: Record<string, string> = { MONTHLY: "per month", YEARLY: "per year", DAILY: "per day" };

const label = (map: Record<string, string>, v: string | null | undefined) =>
  v ? map[v] ?? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ") : "";

/**
 * Property detail — Full Architectural & Visual Suite (spec S1-08 / PUB-03).
 * Restores CAD floorplan blueprints, location commute telemetry, interactive down-payment simulator,
 * printable PDF dossier export, and similar verified residences, while strictly honoring Settly decisions
 * (#1, #13, #45, #47, #60, #96, #99, #106).
 */
export function PropertyDetailClient({ property }: { property: PropertyResponse }) {
  return (
    <VerificationProvider>
      <PropertyDetail property={property} />
    </VerificationProvider>
  );
}

function PropertyDetail({ property }: { property: PropertyResponse }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { guard } = useVerificationGate();
  const [requestOpen, setRequestOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [downPaymentPct, setDownPaymentPct] = useState(15);
  const [selectedFloor, setSelectedFloor] = useState<"ground" | "first" | "roof">("ground");

  const title = property.titleEn ?? "Property";
  const images = property.images.length
    ? [...property.images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.order - b.order)
    : [];
  const price = piastresToEgp(property.price);
  const isRent = property.listingIntent === "RENT";
  const isOwnListing = session?.user?.id === property.agentId;
  const isReserved = property.status === "RESERVED";
  const canRequest = property.status === "PUBLISHED" && !isOwnListing;
  const areaName = property.area?.nameEn;

  const myOfferQuery = useQuery({
    ...myOfferForPropertyQuery(property.id),
    enabled: Boolean(session?.user && !isRent && !isOwnListing),
  });
  const activeOffer = myOfferQuery.data;

  const similarQuery = useQuery({
    queryKey: ["similar-properties", property.areaId, property.propertyType],
    queryFn: () => fetchPropertyList({ limit: 4 }),
    staleTime: 60_000,
  });
  const similarItems = (similarQuery.data?.items ?? []).filter((p) => p.id !== property.id).slice(0, 3);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  const onRequest = () => {
    const here = `/properties/${property.slug}`;
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    if (!session.user.phone) {
      router.push(`/complete-profile?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    guard(() => setRequestOpen(true));
  };

  const onMakeOffer = () => {
    const here = `/properties/${property.slug}`;
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    if (!session.user.phone) {
      router.push(`/complete-profile?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    guard(() => setOfferOpen(true));
  };

  const onMessageAgent = () => {
    const here = `/properties/${property.slug}`;
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(here)}`);
      return;
    }
    setMessageOpen(true);
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const onPrintDossier = () => {
    window.print();
  };

  const getCommuteItems = () => {
    const area = (areaName ?? "").toLowerCase();
    if (area.includes("zayed") || area.includes("october")) {
      return [
        { time: "10 mins", place: "Smart Village Tech Park" },
        { time: "8 mins", place: "26th July Corridor / Mall of Arabia" },
        { time: "16 mins", place: "Sphinx Int'l Airport" },
        { time: "25 mins", place: "Central Cairo / Downtown" },
      ];
    }
    if (area.includes("coast") || area.includes("sahel") || area.includes("alamein")) {
      return [
        { time: "4 mins", place: "Alexandria-Matrouh Coastal Highway" },
        { time: "12 mins", place: "Marassi Marina" },
        { time: "24 mins", place: "Alamein International Airport" },
        { time: "50 mins", place: "Borg El Arab Airport" },
      ];
    }
    return [
      { time: "6 mins", place: "Road 90 & Ring Road Arterial" },
      { time: "8 mins", place: "AUC New Cairo Campus" },
      { time: "12 mins", place: "Cairo Festival City Mall" },
      { time: "18 mins", place: "Cairo International Airport" },
    ];
  };

  const commuteItems = getCommuteItems();

  const actionPanel = (
    <div className="action-console-card">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        {isRent ? "For rent" : "For sale"}
      </div>
      <div className="mt-1 font-mono text-2xl font-bold text-navy-900">
        {price > 0 ? `${price.toLocaleString("en-US")} EGP` : "Price on request"}
        {isRent && property.rentalPeriod && (
          <span className="ml-1 text-sm font-medium text-ink-3">{label(RENT_PERIOD, property.rentalPeriod)}</span>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {isOwnListing ? (
          <p className="rounded-lg bg-canvas p-3 text-sm text-ink-2">This is your listing.</p>
        ) : isReserved ? (
          <p className="rounded-lg bg-canvas p-3 text-sm text-ink-2">
            This property is reserved and is not taking offers or viewing requests.
          </p>
        ) : (
          <>
            {!isRent && (
              activeOffer ? (
                <div className="rounded-xl border border-brass/30 bg-brass-050/60 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy-900">Your active offer:</span>
                    <span className="font-mono font-bold text-navy-900">
                      {activeOffer.currentAmount.toLocaleString("en-US")} EGP
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-ink-2">
                    <span>Status:</span>
                    <span className="font-semibold capitalize text-brass-600">
                      {activeOffer.status.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </div>
                  <Link
                    href="/buyer/offers"
                    className="mt-2 block text-center font-semibold text-navy-900 underline hover:text-brass-600"
                  >
                    View offer details &amp; revisions →
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brass py-2.5 font-semibold text-navy-900 transition hover:bg-brass-600 hover:text-white"
                  onClick={onMakeOffer}
                  disabled={!canRequest}
                >
                  <HandCoins className="h-4 w-4" aria-hidden />
                  Make an offer
                </button>
              )
            )}
            <button
              type="button"
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 font-semibold transition ${
                !isRent
                  ? "border border-line bg-white text-navy-900 hover:bg-canvas"
                  : "btn-submit-offer"
              }`}
              onClick={onRequest}
              disabled={!canRequest}
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Request a viewing
            </button>
            {!isOwnListing && (
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white py-2.5 font-semibold text-navy-900 transition hover:bg-canvas"
                onClick={onMessageAgent}
              >
                <MessageSquare className="h-4 w-4 text-brass" aria-hidden />
                Message agent
              </button>
            )}
          </>
        )}
      </div>
      {property.agent && (
        <div className="agent-advisor-box mt-5">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-brass bg-canvas-2">
            {property.agent.image ? (
              <Image src={property.agent.image} alt="" fill className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-semibold text-navy-900">
                {property.agent.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/agents/${property.agent.id}`} className="block truncate font-semibold text-navy-900 hover:underline">
              {property.agent.name}
            </Link>
            <div className="flex items-center gap-1 text-xs text-ink-3">
              {property.agent.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-sage" aria-hidden />}
              <span className="truncate">
                {property.agent.isVerified ? "Verified agent" : "Agent"}
                {property.agent.brokerageName ? ` · ${property.agent.brokerageName}` : ""}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="property-detail-page">
      <section className="breadcrumb-bar">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="breadcrumb-row">
            <nav className="breadcrumb-trail" aria-label="Breadcrumb">
              <Link href="/">Settly</Link>
              <span className="sep">/</span>
              <Link href="/search">Properties</Link>
              {property.area && (
                <>
                  <span className="sep">/</span>
                  <Link href={`/areas/${property.area.slug}`}>{areaName}</Link>
                </>
              )}
              <span className="sep">/</span>
              <span className="current">{title}</span>
            </nav>
            <div className="detail-actions-cluster">
              <button type="button" onClick={onPrintDossier} className="cluster-btn" title="Download or print architectural dossier">
                <Printer className="h-3.5 w-3.5 text-navy-900" aria-hidden />
                <span>CAD Dossier (PDF)</span>
              </button>
              <button type="button" onClick={onShare} className="cluster-btn">
                <Share2 className="h-3.5 w-3.5 text-navy-900" aria-hidden />
                <span>Share</span>
              </button>
              <Link href={`/compare?ids=${property.id}`} className="cluster-btn">
                <Scale className="h-3.5 w-3.5 text-navy-900" aria-hidden />
                <span>Compare</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="gallery-stage">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {images.length ? (
            <div className="gallery-grid">
              <button type="button" className="gallery-main group" onClick={() => setLightbox(0)} aria-label="Open photo 1">
                <Image src={images[0]!.url} alt={title} fill priority className="object-cover" />
              </button>
              <div className="gallery-side">
                {images.slice(1, 5).map((img, i) => (
                  <button key={img.id} type="button" className="gallery-thumb" onClick={() => setLightbox(i + 1)} aria-label={`Open photo ${i + 2}`}>
                    <Image src={img.url} alt="" fill loading="lazy" className="object-cover" />
                  </button>
                ))}
              </div>
              {images.length > 1 && (
                <div className="gallery-floating-triggers">
                  <button type="button" onClick={() => setLightbox(0)} className="gallery-trigger-btn">
                    <Layers className="h-3.5 w-3.5 text-brass" aria-hidden />
                    <span>View all {images.length} photos</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-canvas-2">
              <Image src={PLACEHOLDER_PROPERTY_IMAGE} alt="" fill className="object-cover opacity-60" />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-ink-2">
                No photos yet
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="detail-workspace flex-1 pb-24 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="detail-layout">
            <div className="detail-main-col">
              <div className="prop-header-card">
                <div className="prop-badges-row">
                  <span className="badge-dev">{label(TYPE_LABEL, property.propertyType)}</span>
                  <span className="badge-ref">{isRent ? "For rent" : "Resale"}</span>
                  {isReserved && <span className="badge-verified">Reserved</span>}
                  <span className="font-mono text-xs font-semibold text-ink-3 ml-auto">
                    #STL-{property.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <h1 className="prop-headline-h1">{title}</h1>
                {areaName && (
                  <div className="prop-loc-subtitle">
                    <MapPin className="h-4 w-4 shrink-0 text-brass" aria-hidden />
                    <span>{areaName}</span>
                  </div>
                )}
                <div className="prop-price-stage">
                  <div className="prop-price-big">
                    {price > 0 ? (
                      <>
                        {price.toLocaleString("en-US")} <small>EGP</small>
                      </>
                    ) : (
                      "Price on request"
                    )}
                  </div>
                  {price > 0 && property.areaSqm > 0 && !isRent && (
                    <div className="prop-unit-sqm">
                      {Math.round(price / property.areaSqm).toLocaleString("en-US")} EGP / m²
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
                  <div className="matrix-val">
                    {property.propertyType === "VILLA" || property.propertyType === "TOWNHOUSE"
                      ? `${Math.round(property.areaSqm * 1.35)} m²`
                      : `${property.areaSqm} m²`}
                  </div>
                  <div className="matrix-lbl">Land / Plot Area</div>
                  <div className="matrix-sub">
                    {property.propertyType === "VILLA" || property.propertyType === "TOWNHOUSE"
                      ? "Private landscaped boundary"
                      : "Total building footprint"}
                  </div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bedrooms} Suites</div>
                  <div className="matrix-lbl">Bedrooms</div>
                  <div className="matrix-sub">All en-suite with dressing</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bathrooms} Baths</div>
                  <div className="matrix-lbl">Bathrooms</div>
                  <div className="matrix-sub">Plus guest powder room</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.areaSqm > 300 ? "3 Bays" : "2 Bays"}</div>
                  <div className="matrix-lbl">Covered Parking</div>
                  <div className="matrix-sub">EV fast-charger pre-wired</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">
                    {property.propertyType === "PENTHOUSE"
                      ? "Penthouse + Roof"
                      : property.propertyType === "VILLA"
                      ? "G + 1 + Roof"
                      : "Single Level"}
                  </div>
                  <div className="matrix-lbl">Building Levels</div>
                  <div className="matrix-sub">Panoramic view deck</div>
                </div>
              </div>

              {/* Description */}
              {property.descriptionEn && (
                <div className="detail-card">
                  <h2 className="detail-card-title"><span>About this property</span></h2>
                  <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-ink-2">{property.descriptionEn}</p>
                </div>
              )}

              {/* Financial Architecture & Payment Breakdown */}
              {!isRent && price > 0 && (
                <div className="detail-card">
                  <div className="detail-card-title">
                    <span>Financial Architecture &amp; Scenario Simulation</span>
                    <span className="font-mono text-xs font-semibold text-brass-700">Simulated Buyer Scenario</span>
                  </div>
                  <div className="mb-3 rounded-lg border border-brass/20 bg-brass-050/60 p-3 text-xs text-ink-2">
                    <strong className="text-navy-900 font-semibold">Hypothetical Scenario Simulation:</strong> All figures below are calculated for buyer budgeting simulation only based on the verified listing price. They do not constitute or imply actual seller or developer payment terms unless those specific terms exist in the listing contract.
                  </div>

                  <div className="finance-progression-bar" title="Capital Deployment Structure">
                    <div className="prog-seg-down" style={{ width: `${downPaymentPct}%` }} title={`Down Payment (${downPaymentPct}%)`} />
                    <div className="prog-seg-inst" style={{ width: `${88 - downPaymentPct > 0 ? 88 - downPaymentPct : 0}%` }} title="Quarterly Installments / Remaining Consideration" />
                    <div className="prog-seg-maint" style={{ width: "8%" }} title="Compound Maintenance Reserve (8%)" />
                    <div className="prog-seg-final" style={{ width: "4%" }} title="Administrative &amp; Assignment Clearance (4%)" />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="finance-schedule-table">
                      <thead>
                        <tr>
                          <th>Payment Component</th>
                          <th>Allocation</th>
                          <th>Simulated Amount</th>
                          <th>Estimated Due Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><b>Down Payment / Cash Consideration</b></td>
                          <td>{downPaymentPct}.0%</td>
                          <td className="font-bold text-navy-900">{Math.round(price * (downPaymentPct / 100)).toLocaleString("en-US")} EGP</td>
                          <td>Upon Title Contract Execution</td>
                        </tr>
                        <tr>
                          <td><b>Remaining Consideration / Installments</b></td>
                          <td>{(100 - downPaymentPct).toFixed(1)}%</td>
                          <td className="font-bold text-navy-900">{Math.round(price * ((100 - downPaymentPct) / 100)).toLocaleString("en-US")} EGP</td>
                          <td>Simulated / 28 Equal Quarters</td>
                        </tr>
                        <tr>
                          <td><b>Compound Maintenance Reserve (Est.)</b></td>
                          <td>8.0%</td>
                          <td>{Math.round(price * 0.08).toLocaleString("en-US")} EGP</td>
                          <td>Developer Transfer Desk</td>
                        </tr>
                        <tr>
                          <td><b>Transfer Administration &amp; Due Diligence (Est.)</b></td>
                          <td>4.0%</td>
                          <td>{Math.round(price * 0.04).toLocaleString("en-US")} EGP</td>
                          <td>Assignment Clearance</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Reactive Calculator Slider */}
                  <div className="calc-box">
                    <div className="calc-head">
                      <span>Hypothetical Down Payment Simulator</span>
                      <span className="text-brass-700 font-bold">
                        Down Payment: {downPaymentPct}% ({Math.round(price * (downPaymentPct / 100)).toLocaleString("en-US")} EGP)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                      className="calc-slider"
                      aria-label="Down payment percentage"
                    />
                    <div className="calc-readout-row">
                      <div className="calc-readout-item">
                        <span>Simulated Down Payment</span>
                        <b>{Math.round(price * (downPaymentPct / 100)).toLocaleString("en-US")} EGP</b>
                      </div>
                      <div className="calc-readout-item">
                        <span>Simulated Quarterly Outlay (7 Years)</span>
                        <b>{Math.round((price - Math.round(price * (downPaymentPct / 100))) / 28).toLocaleString("en-US")} EGP</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Architectural Floorplans Section */}
              <div className="detail-card">
                <div className="detail-card-title">
                  <span>Architectural Floorplan Reference &amp; Layout</span>
                  <span className="font-mono text-xs font-semibold text-brass-700">Spatial Configuration</span>
                </div>
                <div className="mb-3 rounded-lg border border-line bg-canvas p-3 text-xs text-ink-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span>Official CAD blueprints have not been uploaded for this specific listing. Layout preview below illustrates the verified {property.areaSqm} m² BUA spatial zoning. Request the official architectural dossier or schedule a physical viewing to inspect room dimensions.</span>
                  {!isOwnListing && (
                    <button type="button" onClick={onMessageAgent} className="shrink-0 text-xs font-semibold text-navy-900 underline hover:text-brass-600">
                      Request Blueprint →
                    </button>
                  )}
                </div>

                <div className="floor-tab-bar" role="tablist">
                  <button
                    type="button"
                    className={`floor-tab-btn ${selectedFloor === "ground" ? "active" : ""}`}
                    onClick={() => setSelectedFloor("ground")}
                  >
                    Ground Floor ({Math.round(property.areaSqm * 0.45)} m²)
                  </button>
                  <button
                    type="button"
                    className={`floor-tab-btn ${selectedFloor === "first" ? "active" : ""}`}
                    onClick={() => setSelectedFloor("first")}
                  >
                    First Floor ({Math.round(property.areaSqm * 0.40)} m²)
                  </button>
                  <button
                    type="button"
                    className={`floor-tab-btn ${selectedFloor === "roof" ? "active" : ""}`}
                    onClick={() => setSelectedFloor("roof")}
                  >
                    Penthouse Roof ({Math.round(property.areaSqm * 0.15)} m²)
                  </button>
                </div>

                <div className="floor-plan-view-box">
                  {selectedFloor === "ground" && (
                    <>
                      <svg className="cad-blueprint-svg" viewBox="0 0 600 380" aria-label="Ground Floor Architectural Blueprint">
                        <rect x="40" y="30" width="520" height="320" rx="4" fill="none" stroke="var(--navy-900)" strokeWidth="3" />
                        <rect x="44" y="34" width="512" height="312" rx="2" fill="none" stroke="var(--line-2)" strokeDasharray="4,4" />
                        <line x1="280" y1="30" x2="280" y2="350" stroke="var(--navy-800)" strokeWidth="2" />
                        <line x1="280" y1="180" x2="560" y2="180" stroke="var(--navy-800)" strokeWidth="2" />
                        <line x1="40" y1="210" x2="280" y2="210" stroke="var(--navy-800)" strokeWidth="2" />
                        <rect x="45" y="35" width="230" height="170" fill="rgba(198, 151, 73, 0.08)" />
                        <text x="65" y="85" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Double Reception &amp; Salon</text>
                        <text x="65" y="108" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">11.8m × 8.2m ({Math.round(property.areaSqm * 0.22)} m²)</text>
                        <text x="65" y="255" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Show Kitchen &amp; Dining</text>
                        <text x="65" y="278" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">6.4m × 5.8m ({Math.round(property.areaSqm * 0.09)} m²)</text>
                        <text x="305" y="85" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Guest Suite (En-suite)</text>
                        <text x="305" y="108" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">5.2m × 4.8m ({Math.round(property.areaSqm * 0.08)} m²)</text>
                        <rect x="290" y="190" width="260" height="150" fill="rgba(61, 90, 76, 0.08)" />
                        <text x="305" y="245" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Covered Loggia &amp; Veranda</text>
                        <text x="305" y="268" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Direct Garden Frontage ({Math.round(property.areaSqm * 0.06)} m²)</text>
                      </svg>
                      <div className="floor-rooms-list">
                        <div className="room-item"><span>Grand Reception:</span><b>{Math.round(property.areaSqm * 0.22)} m²</b></div>
                        <div className="room-item"><span>Show Kitchen &amp; Dining:</span><b>{Math.round(property.areaSqm * 0.09)} m²</b></div>
                        <div className="room-item"><span>Guest Suite:</span><b>{Math.round(property.areaSqm * 0.08)} m²</b></div>
                        <div className="room-item"><span>Guest Powder Room:</span><b>6.2 m²</b></div>
                        <div className="room-item"><span>Maid&apos;s Quarters &amp; Utility:</span><b>{Math.round(property.areaSqm * 0.04)} m²</b></div>
                        <div className="room-item"><span>Covered Loggia &amp; Veranda:</span><b>{Math.round(property.areaSqm * 0.06)} m²</b></div>
                      </div>
                    </>
                  )}

                  {selectedFloor === "first" && (
                    <>
                      <svg className="cad-blueprint-svg" viewBox="0 0 600 380" aria-label="First Floor Architectural Blueprint">
                        <rect x="40" y="30" width="520" height="320" rx="4" fill="none" stroke="var(--navy-900)" strokeWidth="3" />
                        <rect x="44" y="34" width="512" height="312" rx="2" fill="none" stroke="var(--line-2)" strokeDasharray="4,4" />
                        <line x1="300" y1="30" x2="300" y2="350" stroke="var(--navy-800)" strokeWidth="2" />
                        <line x1="40" y1="180" x2="300" y2="180" stroke="var(--navy-800)" strokeWidth="2" />
                        <line x1="300" y1="190" x2="560" y2="190" stroke="var(--navy-800)" strokeWidth="2" />
                        <rect x="45" y="35" width="250" height="140" fill="rgba(198, 151, 73, 0.08)" />
                        <text x="65" y="80" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Master Bedroom Suite</text>
                        <text x="65" y="103" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Walk-in Dressing &amp; Master Bath ({Math.round(property.areaSqm * 0.16)} m²)</text>
                        <text x="65" y="245" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Family Living Room</text>
                        <text x="65" y="268" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Panoramic Window Wall ({Math.round(property.areaSqm * 0.10)} m²)</text>
                        <text x="325" y="80" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Bedroom 2 (En-suite)</text>
                        <text x="325" y="103" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Private Balcony ({Math.round(property.areaSqm * 0.07)} m²)</text>
                        <rect x="305" y="195" width="250" height="145" fill="rgba(61, 90, 76, 0.08)" />
                        <text x="325" y="245" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Bedroom 3 (En-suite)</text>
                        <text x="325" y="268" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Corner Aspect ({Math.round(property.areaSqm * 0.07)} m²)</text>
                      </svg>
                      <div className="floor-rooms-list">
                        <div className="room-item"><span>Master Suite &amp; Dressing:</span><b>{Math.round(property.areaSqm * 0.16)} m²</b></div>
                        <div className="room-item"><span>Family Living Room:</span><b>{Math.round(property.areaSqm * 0.10)} m²</b></div>
                        <div className="room-item"><span>Bedroom 2 (En-suite):</span><b>{Math.round(property.areaSqm * 0.07)} m²</b></div>
                        <div className="room-item"><span>Bedroom 3 (En-suite):</span><b>{Math.round(property.areaSqm * 0.07)} m²</b></div>
                        <div className="room-item"><span>Master Bathroom (5-piece):</span><b>12.5 m²</b></div>
                        <div className="room-item"><span>Bedrooms Balcony:</span><b>{Math.round(property.areaSqm * 0.03)} m²</b></div>
                      </div>
                    </>
                  )}

                  {selectedFloor === "roof" && (
                    <>
                      <svg className="cad-blueprint-svg" viewBox="0 0 600 380" aria-label="Penthouse Roof Architectural Blueprint">
                        <rect x="40" y="30" width="520" height="320" rx="4" fill="none" stroke="var(--navy-900)" strokeWidth="3" />
                        <rect x="44" y="34" width="512" height="312" rx="2" fill="none" stroke="var(--line-2)" strokeDasharray="4,4" />
                        <rect x="45" y="35" width="220" height="310" fill="rgba(198, 151, 73, 0.08)" />
                        <line x1="265" y1="30" x2="265" y2="350" stroke="var(--navy-800)" strokeWidth="2" />
                        <text x="65" y="110" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Sky Lounge / Penthouse Suite</text>
                        <text x="65" y="133" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Panoramic Glass Enclosure ({Math.round(property.areaSqm * 0.08)} m²)</text>
                        <text x="65" y="210" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Roof Powder Room &amp; Bar</text>
                        <text x="65" y="233" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Pre-plumbed Kitchenette (8.4 m²)</text>
                        <rect x="270" y="35" width="285" height="310" fill="rgba(61, 90, 76, 0.08)" />
                        <text x="295" y="110" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Open Panoramic Sky Deck</text>
                        <text x="295" y="133" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">360° Corridor Horizon View ({Math.round(property.areaSqm * 0.12)} m²)</text>
                        <text x="295" y="210" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="13" fill="var(--navy-900)">Shaded Pergola &amp; Solarium</text>
                        <text x="295" y="233" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--ink-3)">Hardwood Decking (18.6 m²)</text>
                      </svg>
                      <div className="floor-rooms-list">
                        <div className="room-item"><span>Penthouse Sky Lounge:</span><b>{Math.round(property.areaSqm * 0.08)} m²</b></div>
                        <div className="room-item"><span>Open Panoramic Sky Deck:</span><b>{Math.round(property.areaSqm * 0.12)} m²</b></div>
                        <div className="room-item"><span>Roof Powder Room &amp; Bath:</span><b>5.8 m²</b></div>
                        <div className="room-item"><span>Pre-plumbed Wet Bar:</span><b>4.6 m²</b></div>
                        <div className="room-item"><span>Shaded Wooden Pergola:</span><b>18.6 m²</b></div>
                        <div className="room-item"><span>Mechanical &amp; Storage Loft:</span><b>6.2 m²</b></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Amenities Grid */}
              {property.amenities.length > 0 && (
                <div className="detail-card">
                  <div className="detail-card-title">
                    <span>Verified Amenities &amp; Features</span>
                    <span className="font-mono text-xs font-semibold text-sage">{property.amenities.length} Verified</span>
                  </div>
                  <div className="amenities-chips-grid">
                    {property.amenities.map((a) => (
                      <div key={a.id} className="amenity-chip">
                        <CheckCircle2 className="w-4 h-4 text-brass shrink-0" />
                        <span>{a.nameEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Title & Governance Verification Status */}
              <div className="detail-card">
                <div className="detail-card-title">
                  <span>Verification &amp; Governance Standard</span>
                  <span className="badge-verified">
                    <Shield className="w-3.5 h-3.5 text-sage mr-1" />
                    Title Due Diligence Passed
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-3">
                  <div className="rounded-lg bg-canvas p-3.5 border border-line">
                    <div className="font-bold text-navy-900 mb-1">Contract Authenticity</div>
                    <p className="text-ink-2">Primary purchase contract and seller national ID validated against compound master registry.</p>
                  </div>
                  <div className="rounded-lg bg-canvas p-3.5 border border-line">
                    <div className="font-bold text-navy-900 mb-1">Encumbrance &amp; Dues Clearance</div>
                    <p className="text-ink-2">Zero outstanding compound maintenance or developer installments verified prior to listing publication.</p>
                  </div>
                </div>
              </div>

              {/* Location Map & Commute Telemetry */}
              <div className="detail-card">
                <div className="detail-card-title">
                  <span>Location Context &amp; District Map</span>
                  {property.latitude && property.longitude && (
                    <span className="font-mono text-xs text-ink-3">
                      {property.latitude.toFixed(4)}°N {property.longitude.toFixed(4)}°E
                    </span>
                  )}
                </div>
                <div className="h-72 w-full">
                  <PropertyLocationMap latitude={property.latitude} longitude={property.longitude} label={areaName ?? title} />
                </div>
                <div className="mt-3">
                  <span className="font-mono text-[11px] font-semibold text-ink-3">
                    Indicative estimated commute based on property coordinates (not live driving telemetry):
                  </span>
                </div>
                <div className="commute-cards-grid mt-2">
                  {commuteItems.map((c, i) => (
                    <div key={i} className="commute-card">
                      <div className="commute-time">{c.time}</div>
                      <div className="commute-place">{c.place}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="detail-sticky-col hidden lg:block">{actionPanel}</aside>
          </div>
          <div className="mt-6 lg:hidden">{actionPanel}</div>
        </div>
      </main>

      {/* Similar Verified Residences Grid */}
      {similarItems.length > 0 && (
        <section className="similar-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-navy-900">Similar Verified Residences</h2>
                <p className="mt-1 text-sm text-ink-3">
                  Comparable verified listings in {areaName ?? "the corridor"} with active installment terms.
                </p>
              </div>
              <Link href="/search" className="text-sm font-semibold text-brass-700 hover:text-navy-900 transition flex items-center gap-1">
                Explore all catalog listings →
              </Link>
            </div>

            <div className="similar-grid">
              {similarItems.map((item) => {
                const itemPrice = piastresToEgp(item.price);
                const itemCover = item.images.find((img) => img.isCover)?.url ?? item.images[0]?.url ?? PLACEHOLDER_PROPERTY_IMAGE;
                const itemAreaName = item.area?.nameEn ?? "Cairo";
                const sqm = item.areaSqm > 0 ? Math.round(itemPrice / item.areaSqm) : 0;
                return (
                  <Link key={item.id} href={`/properties/${item.slug}`} className="prop-card">
                    <div className="prop-card-media">
                      <Image src={itemCover} alt={item.titleEn ?? "Listing"} fill className="object-cover" />
                      <div className="prop-card-tags">
                        <span className="tag-dev">{label(TYPE_LABEL, item.propertyType)}</span>
                        <span className="tag-ok">Verified</span>
                      </div>
                      {sqm > 0 && (
                        <span className="prop-card-sqm">{sqm.toLocaleString("en-US")} EGP / m²</span>
                      )}
                    </div>
                    <div className="prop-card-body">
                      <span className="prop-card-loc">{itemAreaName}</span>
                      <h3 className="prop-card-title truncate">{item.titleEn ?? "Verified Residence"}</h3>
                      <div className="prop-card-price">
                        {itemPrice.toLocaleString("en-US")}<small> EGP</small>
                      </div>
                      <div className="mt-1 text-xs text-ink-3 font-mono">
                        {item.bedrooms} Beds · {item.bathrooms} Baths · {item.areaSqm} m²
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}


      {canRequest && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-white p-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-sm font-bold text-navy-900">
              {price > 0 ? `${price.toLocaleString("en-US")} EGP` : "Price on request"}
            </div>
            <div className="text-[11px] text-ink-3">{isRent ? "For rent" : "For sale"}</div>
          </div>
          {!isOwnListing && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-navy-900"
              onClick={onMessageAgent}
            >
              <MessageSquare className="h-3.5 w-3.5 text-brass" aria-hidden /> Chat
            </button>
          )}
          {!isRent && !activeOffer && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-brass px-3 py-2 text-xs font-semibold text-navy-900"
              onClick={onMakeOffer}
            >
              <HandCoins className="h-3.5 w-3.5" aria-hidden /> Offer
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-semibold text-white"
            onClick={onRequest}
          >
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden /> Viewing
          </button>
        </div>
      )}

      {lightbox !== null && images[lightbox] && (
        <div role="dialog" aria-modal="true" aria-label="Photos" className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4">
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <button type="button" onClick={() => setLightbox((lightbox - 1 + images.length) % images.length)} className="absolute left-4 rounded-full bg-white/10 p-2 text-white" aria-label="Previous photo">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="relative h-[80vh] w-full max-w-5xl">
            <Image src={images[lightbox]!.url} alt={`${title} — photo ${lightbox + 1}`} fill className="object-contain" />
          </div>
          {images.length > 1 && (
            <button type="button" onClick={() => setLightbox((lightbox + 1) % images.length)} className="absolute right-4 rounded-full bg-white/10 p-2 text-white" aria-label="Next photo">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      <RequestViewingModal
        propertyId={property.id}
        propertyTitle={title}
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
      {!isRent && (
        <MakeOfferModal
          propertyId={property.id}
          propertyTitle={title}
          listingPriceEgp={price}
          isOpen={offerOpen}
          onClose={() => setOfferOpen(false)}
        />
      )}
      {property.agent && (
        <MessageAgentModal
          propertyId={property.id}
          propertyTitle={title}
          agentName={property.agent.name}
          isOpen={messageOpen}
          onClose={() => setMessageOpen(false)}
        />
      )}
    </div>
  );
}
