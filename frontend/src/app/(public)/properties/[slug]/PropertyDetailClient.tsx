"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, CalendarPlus, ChevronLeft, ChevronRight, HandCoins, Layers, MapPin, MessageSquare, Scale, Share2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { PropertyResponse } from "@/api/catalog";
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
 * Property detail — slice scope (spec S1-08). Real listing data only: no invented figures, no
 * developer plan, no deed "certification", no agent phone or WhatsApp contact (#47, #60, C-3, C-9).
 * Offer, message and favourite arrive with their phases and are not rendered (#106).
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
                    View offer details & revisions →
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
                </div>
                <h1 className="prop-headline-h1">{title}</h1>
                {areaName && (
                  <div className="prop-loc-subtitle">
                    <MapPin className="h-4 w-4 shrink-0 text-brass" aria-hidden />
                    <span>{areaName}</span>
                  </div>
                )}
              </div>

              <div className="matrix-grid">
                <div className="matrix-card">
                  <div className="matrix-val">{property.areaSqm} m²</div>
                  <div className="matrix-lbl">Area</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bedrooms}</div>
                  <div className="matrix-lbl">Bedrooms</div>
                </div>
                <div className="matrix-card">
                  <div className="matrix-val">{property.bathrooms}</div>
                  <div className="matrix-lbl">Bathrooms</div>
                </div>
                {price > 0 && property.areaSqm > 0 && !isRent && (
                  <div className="matrix-card">
                    <div className="matrix-val">{Math.round(price / property.areaSqm).toLocaleString("en-US")}</div>
                    <div className="matrix-lbl">EGP per m²</div>
                  </div>
                )}
              </div>

              {property.descriptionEn && (
                <div className="detail-card">
                  <h2 className="detail-card-title"><span>About this property</span></h2>
                  <p className="whitespace-pre-line font-sans text-sm leading-relaxed text-ink-2">{property.descriptionEn}</p>
                </div>
              )}

              {property.amenities.length > 0 && (
                <div className="detail-card">
                  <h2 className="detail-card-title"><span>Amenities</span></h2>
                  <ul className="grid grid-cols-2 gap-2 text-sm text-ink-2 sm:grid-cols-3">
                    {property.amenities.map((a) => (
                      <li key={a.id} className="rounded-lg bg-canvas px-3 py-2">{a.nameEn}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="detail-card">
                <h2 className="detail-card-title"><span>Location</span></h2>
                <div className="h-72 w-full">
                  <PropertyLocationMap latitude={property.latitude} longitude={property.longitude} label={areaName ?? title} />
                </div>
              </div>
            </div>

            <aside className="detail-sticky-col hidden lg:block">{actionPanel}</aside>
          </div>
          <div className="mt-6 lg:hidden">{actionPanel}</div>
        </div>
      </main>

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
