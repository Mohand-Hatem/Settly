"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import {
  Building2,
  MapPin,
  Check,
  Plus,
  Share2,
  Download,
  Sparkles,
  ArrowRight,
  Layers,
  ShieldCheck,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import { ApiError } from "@/api/errors";
import type { CompareItem, CompareResponse } from "@/api/catalog";
import { compareQuery, marketPulseQuery, propertyListQuery } from "@/lib/query/catalog";
import { formatMoney, piastresToEgp, type Currency, type FxRates } from "@/lib/money";
import { isValidLatLng } from "@/lib/geo";
import { ComparisonMatrixSkeleton, Skeleton } from "@/components/ui/Skeleton";
import "@/styles/settly/compare.css";

// Columns shown side by side; the backend enforces the same 2–4 range
const MIN_COMPARE = 2;
const MAX_COMPARE = 4;
const DEFAULT_FX: FxRates = { USD: 48.85, EUR: 53.2 };

/** A compared residence with prices already converted from piastres to EGP. */
interface CompareProperty extends Omit<CompareItem, "titleEn" | "price" | "pricePerSqm"> {
  titleEn: string;
  price: number;
  pricePerSqm: number;
}

interface CatalogPickItem {
  id: string;
  slug: string;
  titleEn: string;
  propertyType: string;
  price: number;
  areaSqm: number;
  coverImage: string | null;
  areaName: string;
}

/** The `ids` URL param is the single source of truth for which residences are compared. */
function parseCompareIds(raw: string | null): string[] {
  const unique = new Set(
    (raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return [...unique].slice(0, MAX_COMPARE);
}

// The only writer of the compare URL. Next.js syncs history.replaceState into
// useSearchParams without a server round-trip.
function replaceCompareIds(ids: readonly string[]) {
  window.history.replaceState(null, "", `/compare?ids=${ids.join(",")}`);
}

// The URL may reference a residence by id or by slug (the API accepts both)
function matchesRef(item: { id: string; slug: string }, ref: string) {
  return item.id === ref || item.slug === ref;
}

function toCompareProperty(item: CompareItem): CompareProperty {
  return {
    ...item,
    titleEn: item.titleEn || "Untitled residence",
    price: piastresToEgp(item.price),
    // The API derives price per m² from the piastre price
    pricePerSqm: Math.round(item.pricePerSqm / 100),
  };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const idsParam = searchParams.get("ids");
  const ids = useMemo(() => parseCompareIds(idsParam), [idsParam]);

  const [currency, setCurrency] = useState<Currency>("EGP");
  const [diffsOnly, setDiffsOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // 1. Live FX rates (falls back to defaults if the pulse is unavailable)
  const { data: fxRates = DEFAULT_FX } = useQuery({
    ...marketPulseQuery(),
    select: (pulse): FxRates => ({
      USD: pulse.currencyRates.usdEgp.official || DEFAULT_FX.USD,
      EUR: pulse.currencyRates.eurEgp.official || DEFAULT_FX.EUR,
    }),
  });

  // 2. Compared residences, keyed by the URL ids and returned in URL order
  const selectCompared = useCallback(
    (res: CompareResponse) =>
      ids
        .map((ref) => res.items.find((item) => matchesRef(item, ref)))
        .filter((item): item is CompareItem => Boolean(item))
        .map(toCompareProperty),
    [ids]
  );
  const compared = useQuery({
    ...compareQuery(ids),
    enabled: ids.length >= MIN_COMPARE,
    select: selectCompared,
    placeholderData: keepPreviousData,
  });
  const properties = useMemo(() => compared.data ?? [], [compared.data]);

  // 3. Without a usable id set (none given, or the API rejected them), seed the
  //    comparison with the latest published residences
  const needsSeed =
    ids.length < MIN_COMPARE ||
    (compared.error instanceof ApiError && compared.error.status === 422);
  const seed = useQuery({
    ...propertyListQuery({ limit: 4 }),
    enabled: needsSeed,
  });
  const seedIds = useMemo(
    () => (seed.data?.items ?? []).slice(0, 3).map((p) => p.id),
    [seed.data]
  );
  const seedUnavailable = seed.isError || (seed.isSuccess && seedIds.length < MIN_COMPARE);
  useEffect(() => {
    if (needsSeed && seedIds.length >= MIN_COMPARE && seedIds.join(",") !== ids.join(",")) {
      replaceCompareIds(seedIds);
    }
  }, [needsSeed, seedIds, ids]);

  const hasNoColumns = properties.length === 0;
  const errorMessage = !hasNoColumns
    ? null
    : needsSeed
      ? seedUnavailable
        ? "Unable to retrieve residences for comparison. Please try selecting other units."
        : null
      : compared.isError
        ? "An unexpected network error occurred while loading property comparisons."
        : null;
  const isLoading = hasNoColumns && !errorMessage;
  const retry = () => (needsSeed ? seed.refetch() : compared.refetch());

  // 4. Add a residence: fetch the enlarged set into the cache first, then point the
  //    URL at it, so the next render reads a warm cache and columns never flicker
  const addMutation = useMutation({
    mutationFn: async (item: CatalogPickItem) => {
      const next = [...ids, item.id];
      await queryClient.fetchQuery(compareQuery(next));
      return next;
    },
    onSuccess: (next, item) => {
      replaceCompareIds(next);
      toast.success("Residence Added", {
        description: `${item.titleEn} added to parametric comparison.`,
      });
    },
    onError: () => {
      toast.error("Addition Failed", {
        description: "Unable to retrieve specifications for the selected residence.",
      });
    },
  });

  const handleSelectPropertyToAdd = (item: CatalogPickItem) => {
    if (properties.length >= MAX_COMPARE) {
      toast.info("Comparison Maximum", {
        description: `A maximum of ${MAX_COMPARE} residences can be evaluated side-by-side.`,
      });
      return;
    }
    setIsAddModalOpen(false);
    addMutation.mutate(item);
  };

  // 5. Remove a residence: derive the smaller set from cached data (no request),
  //    then point the URL at it
  const handleRemoveProperty = (property: CompareProperty) => {
    if (addMutation.isPending) return;
    if (properties.length <= MIN_COMPARE) {
      toast.warning("Comparison Minimum Reached", {
        description: `At least ${MIN_COMPARE} residences are required for side-by-side comparison.`,
      });
      return;
    }
    const next = ids.filter((ref) => !matchesRef(property, ref));
    const current = queryClient.getQueryData(compareQuery(ids).queryKey);
    if (current) {
      const items = current.items.filter((item) => item.id !== property.id);
      queryClient.setQueryData(compareQuery(next).queryKey, {
        ...current,
        items,
        count: items.length,
      });
    }
    replaceCompareIds(next);
    toast.info("Residence Removed", {
      description: `${property.titleEn} removed from comparison.`,
    });
  };

  // 6. Catalog picker, fetched when the modal opens; current columns are excluded at render
  const catalog = useQuery({
    ...propertyListQuery({ limit: 12 }),
    enabled: isAddModalOpen,
  });
  const availableCatalog = useMemo<CatalogPickItem[]>(() => {
    const comparedIds = new Set(properties.map((p) => p.id));
    return (catalog.data?.items ?? [])
      .filter((p) => !comparedIds.has(p.id))
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        titleEn: p.titleEn || "Untitled residence",
        propertyType: p.propertyType,
        price: piastresToEgp(p.price),
        areaSqm: p.areaSqm,
        coverImage: p.images.find((img) => img.isCover)?.url || p.images[0]?.url || null,
        areaName: p.area?.nameEn || "Cairo Corridor",
      }));
  }, [catalog.data, properties]);

  const formatPrice = (egp: number) => formatMoney(egp, currency, fxRates);
  const formatPricePerSqm = (egp: number) =>
    egp > 0 ? `${formatMoney(egp, currency, fxRates)} / m²` : "N/A";

  // 7. Share link action
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
    toast.success("Comparison Link Copied", {
      description: "Direct link to this parametric comparison is copied to clipboard.",
    });
  };

  // 8. Consolidate all amenities across residences
  const allAmenities = useMemo(() => {
    const map = new Map<string, { id: string; nameEn: string; category: string }>();
    properties.forEach((p) => {
      p.amenities?.forEach((a) => {
        if (!map.has(a.slug)) {
          map.set(a.slug, { id: a.id, nameEn: a.nameEn, category: a.category });
        }
      });
    });
    return Array.from(map.entries()).map(([slug, data]) => ({ slug, ...data }));
  }, [properties]);

  // Helper to check if a row differs across properties
  const isRowDifferent = (values: Array<string | number | boolean | null | undefined>) => {
    if (values.length <= 1) return false;
    const first = values[0];
    return values.some((v) => v !== first);
  };

  // Grid class template
  const tableGridClass = useMemo(() => {
    const totalCols = properties.length + (properties.length < MAX_COMPARE ? 1 : 0);
    if (totalCols === 2) return "cols-2";
    if (totalCols === 3) return "cols-3";
    return "cols-4";
  }, [properties.length]);

  return (
    <div className="comp-page-wrapper">
      {/* Top Banner & Control Deck */}
      <section className="comp-deck">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="comp-deck-top">
            <div className="comp-deck-title">
              <h1>Compare Verified Residences</h1>
              <p>
                Side-by-side parametric audit. Cross-analyze financial cash flows, CAD interior footprints,
                legal encumbrances, and verified handover timelines across Egypt&apos;s prime micro-markets.
              </p>
            </div>

            <div className="comp-toolbar">
              {/* Currency Switcher */}
              <div className="currency-pill-box" role="group" aria-label="Currency selector">
                <button
                  type="button"
                  className={`curr-chip ${currency === "EGP" ? "active" : ""}`}
                  onClick={() => setCurrency("EGP")}
                >
                  EGP
                </button>
                <button
                  type="button"
                  className={`curr-chip ${currency === "USD" ? "active" : ""}`}
                  onClick={() => setCurrency("USD")}
                >
                  USD
                </button>
                <button
                  type="button"
                  className={`curr-chip ${currency === "EUR" ? "active" : ""}`}
                  onClick={() => setCurrency("EUR")}
                >
                  EUR
                </button>
                <button
                  type="button"
                  className={`curr-chip ${currency === "AED" ? "active" : ""}`}
                  onClick={() => setCurrency("AED")}
                >
                  AED
                </button>
              </div>

              {/* Differences Only Toggle Switch */}
              <div
                className={`diff-switch-wrap ${diffsOnly ? "active" : ""}`}
                onClick={() => setDiffsOnly(!diffsOnly)}
                role="switch"
                aria-checked={diffsOnly}
                title="Toggle differences only view"
              >
                <div className="diff-switch" />
                <span>Differences only</span>
              </div>

              {/* Share Button */}
              <button
                type="button"
                className="tool-btn"
                onClick={handleShare}
                title="Copy shareable link"
              >
                <Share2 className="w-3.5 h-3.5 text-navy-800" />
                <span>{shareCopied ? "Link Copied!" : "Share"}</span>
              </button>

              {/* Export Dossier */}
              <button
                type="button"
                className="tool-btn"
                onClick={() => window.print()}
                title="Print or export comparison dossier"
              >
                <Download className="w-3.5 h-3.5 text-navy-800" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Comparison Matrix */}
      <main className="comp-workspace">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="-mx-4 sm:-mx-6 lg:-mx-8">
              <ComparisonMatrixSkeleton />
            </div>
          )}

          {errorMessage && (
            <div className="bg-white p-10 rounded-2xl border border-red-200 text-center">
              <p className="text-red-700 font-medium mb-3">{errorMessage}</p>
              <button
                type="button"
                onClick={() => retry()}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition"
              >
                Retry Comparison
              </button>
            </div>
          )}

          {properties.length >= MIN_COMPARE && (
            <div className="comp-table-container">
              <div className="comp-table-scroll">
                <div className={`comp-table ${tableGridClass}`}>
                  {/* =================================================================
                       STICKY SHELF: PROPERTY HEADERS
                       ================================================================= */}
                  <div className="sticky-residence-shelf comp-row">
                    <div className="cell-attr font-serif text-sm text-ink-2 font-semibold">
                      Residences Selected ({properties.length}/4)
                    </div>

                    {properties.map((p) => {
                      const cover = p.coverImage || (p.images && p.images[0]) || PLACEHOLDER_PROPERTY_IMAGE;
                      return (
                        <div key={p.id} className="cell-prop">
                          <div className="prop-header-card">
                            <div className="prop-hdr-top">
                              <ImageWithFallback
                                src={cover}
                                alt={p.titleEn}
                                fill
                                className="prop-hdr-img"
                                sizes="(max-width: 768px) 100vw, 320px"
                              />
                              <span className="prop-hdr-dev-tag">{p.propertyType}</span>
                              <button
                                type="button"
                                className="btn-remove-col"
                                onClick={() => handleRemoveProperty(p)}
                                disabled={addMutation.isPending}
                                title="Remove residence from comparison"
                                aria-label={`Remove ${p.titleEn} from comparison`}
                              >
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                            </div>
                            <div className="prop-hdr-body">
                              <span className="prop-hdr-loc">
                                <MapPin className="w-3 h-3 text-brass" />
                                {p.area.nameEn}
                              </span>
                              <Link href={`/properties/${p.slug}`} className="prop-hdr-title" title={p.titleEn}>
                                {p.titleEn}
                              </Link>
                              <div className="prop-hdr-price-row">
                                <span className="prop-hdr-price">{formatPrice(p.price)}</span>
                              </div>
                            </div>
                            <div className="prop-hdr-actions">
                              <Link href={`/properties/${p.slug}`} className="btn-hdr-action btn-hdr-primary inline-flex items-center justify-center gap-1">
                                <span>Dossier</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                              <Link
                                href={`/properties/${p.slug}`}
                                className="btn-hdr-action btn-hdr-secondary"
                              >
                                Viewing
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Slot if less than 4 properties */}
                    {properties.length < MAX_COMPARE && (
                      <div className="cell-prop">
                        {addMutation.isPending ? (
                          <div className="p-4 space-y-3" aria-busy="true" aria-label="Adding residence">
                            <Skeleton className="w-full h-32 rounded-xl" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2 font-mono" />
                          </div>
                        ) : (
                          <div className="prop-header-empty">
                            <div className="empty-slot-icon">
                              <Plus className="w-5 h-5 text-brass-600" />
                            </div>
                            <div className="empty-slot-title">Add Residence</div>
                            <div className="empty-slot-sub">Compare up to 4 prime properties side-by-side</div>
                            <button
                              type="button"
                              className="btn-add-unit"
                              onClick={() => setIsAddModalOpen(true)}
                            >
                              + Select from Catalog
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================================
                       SECTION 1: FINANCIAL STRUCTURE & CASH FLOW
                       ================================================================= */}
                  <div className="sec-hdr-row">
                    <div className="sec-hdr-title">
                      <Building2 className="w-4 h-4 text-navy-800" />
                      <span>1. Financial Structure & Cash Flow</span>
                    </div>
                    <span className="sec-hdr-badge">0% Interest Benchmark</span>
                  </div>

                  {/* Row: Total Price */}
                  {(() => {
                    const values = properties.map((p) => p.price);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Total Asking Price</div>
                        {properties.map((p) => (
                          <div key={`price-${p.id}`} className="cell-prop">
                            <span className="val-mono">{formatPrice(p.price)}</span>
                            <span className="val-sub">Gross contract value</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Price per m² */}
                  {(() => {
                    const values = properties.map((p) => p.pricePerSqm);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Price per m² (BUA)</div>
                        {properties.map((p) => (
                          <div key={`sqm-${p.id}`} className="cell-prop">
                            <span className="val-mono">{formatPricePerSqm(p.pricePerSqm)}</span>
                            <span className="val-sub">{p.area.nameEn} market rate</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Estimated Down Payment (10%) */}
                  {(() => {
                    const values = properties.map((p) => Math.round(p.price * 0.1));
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Est. Down Payment (10%)</div>
                        {properties.map((p) => (
                          <div key={`down-${p.id}`} className="cell-prop">
                            <span className="val-mono">
                              {formatPrice(Math.round(p.price * 0.1))}
                            </span>
                            <span className="val-sub">10% standard contract reservation</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Quarterly Installment (7 Years / 28 Quarters) */}
                  {(() => {
                    const values = properties.map((p) => Math.round((p.price * 0.8) / 28));
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Quarterly Installment (Est.)</div>
                        {properties.map((p) => {
                          const quarterly = Math.round((p.price * 0.8) / 28);
                          return (
                            <div key={`qtr-${p.id}`} className="cell-prop">
                              <span className="val-mono">{formatPrice(quarterly)} / qtr</span>
                              <span className="val-sub">Based on 7-yr schedule (28 payments)</span>
                            </div>
                          );
                        })}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Listing Intent */}
                  {(() => {
                    const values = properties.map((p) => p.listingIntent);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Transaction Type</div>
                        {properties.map((p) => (
                          <div key={`intent-${p.id}`} className="cell-prop">
                            <span className="val-mono font-semibold text-navy-900">
                              {p.listingIntent === "SALE" ? "Outright Ownership (Sale)" : "Primary Leasehold (Rent)"}
                            </span>
                            <span className="val-sub">Registered title</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* =================================================================
                       SECTION 2: SPATIAL & ARCHITECTURAL FOOTPRINT
                       ================================================================= */}
                  <div className="sec-hdr-row">
                    <div className="sec-hdr-title">
                      <Layers className="w-4 h-4 text-navy-800" />
                      <span>2. Spatial & Architectural Footprint</span>
                    </div>
                    <span className="sec-hdr-badge">CAD Verified</span>
                  </div>

                  {/* Row: Built-Up Area */}
                  {(() => {
                    const values = properties.map((p) => p.areaSqm);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Built-Up Area (BUA)</div>
                        {properties.map((p) => (
                          <div key={`bua-${p.id}`} className="cell-prop">
                            <span className="val-mono">{p.areaSqm} m²</span>
                            <span className="val-sub">Gross architectural interior</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Bedrooms */}
                  {(() => {
                    const values = properties.map((p) => p.bedrooms);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Bedrooms</div>
                        {properties.map((p) => (
                          <div key={`beds-${p.id}`} className="cell-prop">
                            <span className="val-mono">{p.bedrooms} Suites</span>
                            <span className="val-sub">Master en-suite layouts</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Bathrooms */}
                  {(() => {
                    const values = properties.map((p) => p.bathrooms);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Bathrooms</div>
                        {properties.map((p) => (
                          <div key={`baths-${p.id}`} className="cell-prop">
                            <span className="val-mono">{p.bathrooms} Full Baths</span>
                            <span className="val-sub">Luxury marble finish</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Property Type */}
                  {(() => {
                    const values = properties.map((p) => p.propertyType);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Architectural Typology</div>
                        {properties.map((p) => (
                          <div key={`type-${p.id}`} className="cell-prop">
                            <span className="val-mono font-medium">{p.propertyType}</span>
                            <span className="val-sub">Prime structural typology</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* =================================================================
                       SECTION 3: LOCATION & SURROUNDINGS
                       ================================================================= */}
                  <div className="sec-hdr-row">
                    <div className="sec-hdr-title">
                      <MapPin className="w-4 h-4 text-navy-800" />
                      <span>3. Location & Corridor Geography</span>
                    </div>
                    <span className="sec-hdr-badge">GIS Surveyed</span>
                  </div>

                  {/* Row: District / Area */}
                  {(() => {
                    const values = properties.map((p) => p.area.nameEn);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Corridor & District</div>
                        {properties.map((p) => (
                          <div key={`loc-${p.id}`} className="cell-prop">
                            <span className="val-mono font-medium">{p.area.nameEn}</span>
                            <span className="val-sub">Tier-1 master development corridor</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Coordinates */}
                  {(() => {
                    const values = properties.map((p) => `${p.latitude},${p.longitude}`);
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">GIS Coordinates</div>
                        {properties.map((p) => (
                          <div key={`geo-${p.id}`} className="cell-prop">
                            <span className="val-mono text-xs">
                              {isValidLatLng(p.latitude, p.longitude)
                                ? `${p.latitude.toFixed(4)}° N, ${p.longitude.toFixed(4)}° E`
                                : "—"}
                            </span>
                            <span className="val-sub">High precision geodetic pin</span>
                          </div>
                        ))}
                        {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* =================================================================
                       SECTION 4: VERIFIED AMENITIES & PRIVILEGES
                       ================================================================= */}
                  <div className="sec-hdr-row">
                    <div className="sec-hdr-title">
                      <Sparkles className="w-4 h-4 text-navy-800" />
                      <span>4. Verified Amenities & Privileges</span>
                    </div>
                    <span className="sec-hdr-badge">Physical Audit</span>
                  </div>

                  {allAmenities.length > 0 ? (
                    allAmenities.map((amenity) => {
                      const presenceList = properties.map((p) =>
                        p.amenities?.some((a) => a.slug === amenity.slug)
                      );
                      const hasDiff = isRowDifferent(presenceList);
                      if (diffsOnly && !hasDiff) return null;

                      return (
                        <div
                          key={`amenity-row-${amenity.slug}`}
                          className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}
                        >
                          <div className="cell-attr">{amenity.nameEn}</div>
                          {properties.map((p) => {
                            const hasIt = p.amenities?.some((a) => a.slug === amenity.slug);
                            return (
                              <div key={`amenity-${p.id}-${amenity.slug}`} className="cell-prop">
                                {hasIt ? (
                                  <span className="badge-check">
                                    <Check className="w-3.5 h-3.5 text-green-700" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <span className="badge-dash">—</span>
                                )}
                              </div>
                            );
                          })}
                          {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="comp-row is-identical">
                      <div className="cell-attr">Amenities Check</div>
                      {properties.map((p) => (
                        <div key={`no-amenity-${p.id}`} className="cell-prop">
                          <span className="val-sub">Private compound amenities included</span>
                        </div>
                      ))}
                      {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                    </div>
                  )}

                  {/* =================================================================
                       SECTION 5: PLATFORM CERTIFICATION & ACTIONS
                       ================================================================= */}
                  <div className="sec-hdr-row">
                    <div className="sec-hdr-title">
                      <ShieldCheck className="w-4 h-4 text-navy-800" />
                      <span>5. Certification & Advisory Actions</span>
                    </div>
                    <span className="sec-hdr-badge">Fiduciary Guard</span>
                  </div>

                  <div className="comp-row is-identical">
                    <div className="cell-attr">Institutional Actions</div>
                    {properties.map((p) => (
                      <div key={`action-${p.id}`} className="cell-prop">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/properties/${p.slug}`}
                            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold text-center hover:bg-navy-800 transition inline-flex items-center justify-center gap-1"
                          >
                            <span>Full Property Dossier</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/properties/${p.slug}`}
                            className="px-4 py-2 bg-white border border-[rgba(30,42,74,0.18)] text-navy-900 rounded-lg text-xs font-bold text-center hover:bg-canvas transition"
                          >
                            Schedule Private Viewing
                          </Link>
                        </div>
                      </div>
                    ))}
                    {properties.length < MAX_COMPARE && <div className="cell-prop bg-canvas" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Floating Quick-Bar */}
      {properties.length >= MIN_COMPARE && (
        <aside className="comp-bottom-bar" aria-label="Quick comparison summary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="comp-bottom-row">
              <div className="bottom-info-cluster">
                <div className="bottom-info-badge">
                  <b>{properties.length} Residences</b>
                  <span>Compared side-by-side</span>
                </div>
                <div className="bottom-info-badge">
                  <b>{currency}</b>
                  <span>Active calculation base</span>
                </div>
              </div>

              <div className="bottom-actions">
                <button
                  type="button"
                  className="btn-bottom-cta btn-cta-ghost"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{shareCopied ? "Copied!" : "Share Link"}</span>
                </button>
                <a
                  href="mailto:concierge@settly.estate?subject=Private%20Portfolio%20Comparison%20Inquiry"
                  className="btn-bottom-cta btn-cta-brass"
                >
                  <span>Request Advisory Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Catalog Selector Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Residence to Comparison"
        description="Select an available verified listing from the Settly catalog to expand your audit."
        maxWidth="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {catalog.isPending ? (
            <div className="space-y-2.5 py-2" aria-busy="true" aria-label="Loading available residences">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-[rgba(30,42,74,0.08)] bg-white">
                  <Skeleton className="w-16 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-20 font-mono" />
                </div>
              ))}
            </div>
          ) : availableCatalog.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-3">
              No additional published properties available to add.
            </div>
          ) : (
            availableCatalog.map((item) => (
              <button
                key={item.id}
                type="button"
                className="catalog-pick-item"
                onClick={() => handleSelectPropertyToAdd(item)}
              >
                <div className="relative w-20 h-14 rounded-md overflow-hidden flex-none bg-navy-950">
                  <ImageWithFallback
                    src={item.coverImage || PLACEHOLDER_PROPERTY_IMAGE}
                    alt={item.titleEn}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="catalog-pick-info">
                  <b>{item.titleEn}</b>
                  <span>
                    {item.propertyType} • {item.areaSqm} m² • {item.areaName}
                  </span>
                </div>
                <div className="catalog-pick-price">
                  {formatPrice(item.price)}
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<ComparisonMatrixSkeleton />}>
      <CompareContent />
    </Suspense>
  );
}
