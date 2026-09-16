"use client";

import React, { Suspense, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import "@/styles/settly/compare.css";

interface CompareProperty {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  propertyType: string;
  listingIntent: string;
  price: string;
  rentalPeriod: string | null;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  pricePerSqm: number;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  images: string[];
  area: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
  };
  amenities: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    category: string;
  }>;
}

interface CatalogPickItem {
  id: string;
  slug: string;
  titleEn: string;
  propertyType: string;
  price: string;
  areaSqm: number;
  coverImage: string | null;
  areaName: string;
}

type Currency = "EGP" | "USD" | "EUR";

// The backend's /catalog/compare endpoint has no ORDER BY matching the requested `ids`,
// so it can return residences in a different order than they were requested/added in.
// Re-sort every response to the requested id order before it reaches state, so columns
// never visibly reshuffle.
function sortByRequestedIds<T extends { id: string }>(records: T[], requestedIds: string[]): T[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  return requestedIds.map((id) => byId.get(id)).filter((r): r is T => Boolean(r));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompareProperty(item: any): CompareProperty {
  const rawPrice = item.price ? BigInt(item.price) : 0n;
  // Settly backend stores and returns prices in piastres (e.g. 2720000000 for 27.2M EGP)
  const priceEgp = rawPrice > 100000000n ? (rawPrice / 100n).toString() : item.price?.toString() || "0";
  const rawPricePerSqm = Number(item.pricePerSqm) || 0;
  const pricePerSqmEgp = rawPricePerSqm > 100000 ? Math.round(rawPricePerSqm / 100) : rawPricePerSqm;

  return {
    ...item,
    price: priceEgp,
    pricePerSqm: pricePerSqmEgp,
  };
}

function CompareContent() {
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<CompareProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingPropertyId, setAddingPropertyId] = useState<string | null>(null);

  // Cache ref to track loaded IDs and prevent redundant double-fetch loops when URL updates
  const lastLoadedIdsRef = useRef<string>("");
  const initialFetchDoneRef = useRef<boolean>(false);

  // Currency engine
  const [currency, setCurrency] = useState<Currency>("EGP");
  const [fxRates, setFxRates] = useState<{ USD: number; EUR: number }>({
    USD: 48.85,
    EUR: 53.20,
  });

  // Differences toggle
  const [diffsOnly, setDiffsOnly] = useState(false);

  // Add Residence modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableCatalog, setAvailableCatalog] = useState<CatalogPickItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // 1. Fetch live FX rates from market pulse
  useEffect(() => {
    async function loadFx() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${apiBase}/api/v1/analytics/market-pulse`);
        if (res.ok) {
          const data = await res.json();
          if (data.currencyRates?.usdEgp?.official && data.currencyRates?.eurEgp?.official) {
            setFxRates({
              USD: data.currencyRates.usdEgp.official,
              EUR: data.currencyRates.eurEgp.official,
            });
          }
        }
      } catch {
        // Fallback default rates
      }
    }
    loadFx();
  }, []);

  // 2. Fetch compared properties based on query params (Initial Load & Cold Hydration)
  const loadProperties = useCallback(async () => {
    const idsParam = searchParams.get("ids");
    let targetIds: string[] = [];

    if (idsParam) {
      targetIds = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    const currentKey = targetIds.join(",");
    // If the requested IDs already match our loaded state, skip redundant fetch
    if (currentKey && currentKey === lastLoadedIdsRef.current && properties.length >= 2) {
      return;
    }

    setLoading(true);
    setError(null);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      if (targetIds.length >= 2) {
        const res = await fetch(
          `${apiBase}/api/v1/catalog/compare?ids=${targetIds.join(",")}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length >= 2) {
            const normalized = sortByRequestedIds<CompareProperty>(
              data.items.map(normalizeCompareProperty),
              targetIds
            );
            lastLoadedIdsRef.current = targetIds.join(",");
            setProperties(normalized);
            setLoading(false);
            return;
          }
        }
      }

      // If no valid IDs or fewer than 2 properties in query, fetch latest published properties
      const fallbackRes = await fetch(`${apiBase}/api/v1/properties?limit=4`);
      if (fallbackRes.ok) {
        const catalogData = await fallbackRes.json();
        const items = catalogData.items || [];
        if (items.length >= 2) {
          const pickIds = items.slice(0, 3).map((p: { id: string }) => p.id);
          const compRes = await fetch(
            `${apiBase}/api/v1/catalog/compare?ids=${pickIds.join(",")}`
          );
          if (compRes.ok) {
            const compData = await compRes.json();
            const normalized = sortByRequestedIds<CompareProperty>(
              (compData.items || []).map(normalizeCompareProperty),
              pickIds
            );
            const newKey = pickIds.join(",");
            lastLoadedIdsRef.current = newKey;
            setProperties(normalized);
            setLoading(false);
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", `/compare?ids=${newKey}`);
            }
            return;
          }
        }
      }

      setError("Unable to retrieve residences for comparison. Please try selecting other units.");
    } catch (err) {
      console.error("Failed to load comparison data:", err);
      setError("An unexpected network error occurred while loading property comparisons.");
    } finally {
      setLoading(false);
    }
  }, [searchParams, properties.length]);

  useEffect(() => {
    const idsParam = searchParams.get("ids") || "";
    if (!initialFetchDoneRef.current || (idsParam && idsParam !== lastLoadedIdsRef.current)) {
      initialFetchDoneRef.current = true;
      loadProperties();
    }
  }, [searchParams, loadProperties]);

  // 3. Remove column - Optimistic CSR (0ms latency, zero reload)
  const handleRemoveProperty = (indexToRemove: number) => {
    if (properties.length <= 2) {
      toast.warning("Comparison Minimum Reached", {
        description: "At least 2 residences are required for side-by-side comparison.",
      });
      return;
    }
    const removedItem = properties[indexToRemove];
    const updated = properties.filter((_, idx) => idx !== indexToRemove);
    const updatedIds = updated.map((p) => p.id).join(",");
    lastLoadedIdsRef.current = updatedIds;
    setProperties(updated);

    toast.info("Residence Removed", {
      description: `${removedItem?.titleEn || "Residence"} removed from comparison.`,
    });

    // Update URL cleanly without triggering Next.js route navigation
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/compare?ids=${updatedIds}`);
    }
  };

  // 4. Open Add Residence Catalog Drawer
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    setLoadingCatalog(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiBase}/api/v1/properties?limit=12`);
      if (res.ok) {
        const data = await res.json();
        const existingIds = new Set(properties.map((p) => p.id));
        type RawApiProperty = {
          id: string;
          slug: string;
          titleEn: string;
          propertyType: string;
          price: string;
          areaSqm: number | string;
          images?: Array<{ url: string; isCover?: boolean }>;
          area?: { nameEn?: string };
        };
        const available = (data.items || [])
          .filter((p: { id: string }) => !existingIds.has(p.id))
          .map((p: RawApiProperty) => {
            const rawPrice = p.price ? BigInt(p.price) : 0n;
            const priceEgp = rawPrice > 100000000n ? (rawPrice / 100n).toString() : p.price;
            return {
              id: p.id,
              slug: p.slug,
              titleEn: p.titleEn,
              propertyType: p.propertyType,
              price: priceEgp,
              areaSqm: Number(p.areaSqm),
              coverImage: p.images?.find((img) => img.isCover)?.url || p.images?.[0]?.url || "/images/properties/property-1.jpg",
              areaName: p.area?.nameEn || "Cairo Corridor",
            };
          });
        setAvailableCatalog(available);
      }
    } catch (err) {
      console.error("Failed to fetch available catalog:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  // 5. Select a property to add - Non-destructive inline addition
  const handleSelectPropertyToAdd = async (item: CatalogPickItem) => {
    if (properties.length >= 4) {
      toast.info("Comparison Maximum", {
        description: "A maximum of 4 residences can be evaluated side-by-side.",
      });
      return;
    }
    setIsAddModalOpen(false);
    setAddingPropertyId(item.id);

    const newIds = [...properties.map((p) => p.id), item.id];
    const newIdsKey = newIds.join(",");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(
        `${apiBase}/api/v1/catalog/compare?ids=${newIdsKey}`
      );
      if (res.ok) {
        const data = await res.json();
        const normalized = (data.items || []).map(normalizeCompareProperty);
        const newItem = normalized.find((p: CompareProperty) => p.id === item.id);
        lastLoadedIdsRef.current = newIdsKey;
        // Append only the newly fetched residence and keep existing columns' object
        // references untouched, so React skips re-rendering (and re-flashing the
        // images of) the residences that were already in the comparison.
        setProperties((prev) => (newItem ? [...prev, newItem] : normalized));

        toast.success("Residence Added", {
          description: `${item.titleEn} added to parametric comparison.`,
        });

        // Update URL cleanly without triggering Next.js route navigation
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `/compare?ids=${newIdsKey}`);
        }
      } else {
        toast.error("Addition Failed", {
          description: "Unable to retrieve specifications for the selected residence.",
        });
      }
    } catch (err) {
      console.error("Failed to add property to comparison:", err);
      toast.error("Network Error", {
        description: "Could not connect to Settly catalog services.",
      });
    } finally {
      setAddingPropertyId(null);
    }
  };

  // 6. Currency Formatter (Safe for EGP or Piastres)
  const formatPrice = (egpAmount: number | string) => {
    let num = Number(egpAmount);
    if (isNaN(num)) return "N/A";
    // Safeguard: if amount is in piastres (> 100M for Egyptian luxury residences), convert to EGP
    if (num > 100000000) {
      num = Math.round(num / 100);
    }

    if (currency === "USD") {
      const usdVal = Math.round(num / (fxRates.USD || 48.85));
      return `$${usdVal.toLocaleString("en-US")}`;
    }
    if (currency === "EUR") {
      const eurVal = Math.round(num / (fxRates.EUR || 53.20));
      return `€${eurVal.toLocaleString("en-US")}`;
    }
    return `${num.toLocaleString("en-US")} EGP`;
  };

  // 7. Format Price / m² (Safe for EGP or Piastres)
  const formatPricePerSqm = (egpAmount: number) => {
    let val = egpAmount;
    if (isNaN(val) || val <= 0) return "N/A";
    if (val > 100000) {
      val = Math.round(val / 100);
    }
    if (currency === "USD") {
      const usdVal = Math.round(val / (fxRates.USD || 48.85));
      return `$${usdVal.toLocaleString("en-US")} / m²`;
    }
    if (currency === "EUR") {
      const eurVal = Math.round(val / (fxRates.EUR || 53.20));
      return `€${eurVal.toLocaleString("en-US")} / m²`;
    }
    return `${val.toLocaleString("en-US")} EGP / m²`;
  };

  // 8. Share link action
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
      toast.success("Comparison Link Copied", {
        description: "Direct link to this parametric comparison is copied to clipboard.",
      });
    }
  };

  // 9. Consolidate all amenities across residences
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
    const totalCols = properties.length + (properties.length < 4 ? 1 : 0);
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
          {loading && properties.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-[rgba(30,42,74,0.12)] text-center">
              <div className="inline-block w-8 h-8 border-3 border-[#C69749] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-serif text-lg text-navy-900 font-medium">Assembling parametric comparison matrix...</p>
              <p className="text-xs text-ink-3 mt-1 font-mono">Querying verified specifications and CAD geometry</p>
            </div>
          )}

          {error && properties.length === 0 && (
            <div className="bg-white p-10 rounded-2xl border border-red-200 text-center">
              <p className="text-red-700 font-medium mb-3">{error}</p>
              <button
                type="button"
                onClick={() => loadProperties()}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 transition"
              >
                Retry Comparison
              </button>
            </div>
          )}

          {properties.length >= 2 && (
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

                    {properties.map((p, idx) => {
                      const cover = p.coverImage || (p.images && p.images[0]) || "/images/properties/property-1.jpg";
                      return (
                        <div key={p.id} className="cell-prop">
                          <div className="prop-header-card">
                            <div className="prop-hdr-top">
                              <Image
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
                                onClick={() => handleRemoveProperty(idx)}
                                title="Remove residence from comparison"
                                aria-label={`Remove ${p.titleEn} from comparison`}
                              >
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </button>
                            </div>
                            <div className="prop-hdr-body">
                              <span className="prop-hdr-loc">
                                <MapPin className="w-3 h-3 text-[#C69749]" />
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
                              <Link href={`/properties/${p.slug}`} className="btn-hdr-action btn-hdr-primary">
                                Dossier →
                              </Link>
                              <a
                                href={`mailto:advisory@settly.estate?subject=Viewing%20Inquiry%3A%20${encodeURIComponent(p.titleEn)}`}
                                className="btn-hdr-action btn-hdr-secondary"
                              >
                                Viewing
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty Slot if less than 4 properties */}
                    {properties.length < 4 && (
                      <div className="cell-prop">
                        {addingPropertyId ? (
                          <div className="prop-header-empty animate-pulse">
                            <div className="empty-slot-icon">
                              <div className="w-5 h-5 border-2 border-[#C69749] border-t-transparent rounded-full animate-spin" />
                            </div>
                            <div className="empty-slot-title">Adding Residence...</div>
                            <div className="empty-slot-sub">Querying verified CAD metrics</div>
                          </div>
                        ) : (
                          <div className="prop-header-empty">
                            <div className="empty-slot-icon">
                              <Plus className="w-5 h-5 text-[#AE8033]" />
                            </div>
                            <div className="empty-slot-title">Add Residence</div>
                            <div className="empty-slot-sub">Compare up to 4 prime properties side-by-side</div>
                            <button
                              type="button"
                              className="btn-add-unit"
                              onClick={handleOpenAddModal}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Estimated Down Payment (10%) */}
                  {(() => {
                    const values = properties.map((p) => Math.round(Number(p.price) * 0.1));
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Est. Down Payment (10%)</div>
                        {properties.map((p) => (
                          <div key={`down-${p.id}`} className="cell-prop">
                            <span className="val-mono">
                              {formatPrice(Math.round(Number(p.price) * 0.1))}
                            </span>
                            <span className="val-sub">10% standard contract reservation</span>
                          </div>
                        ))}
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
                      </div>
                    );
                  })()}

                  {/* Row: Quarterly Installment (7 Years / 28 Quarters) */}
                  {(() => {
                    const values = properties.map((p) => Math.round((Number(p.price) * 0.8) / 28));
                    const hasDiff = isRowDifferent(values);
                    if (diffsOnly && !hasDiff) return null;
                    return (
                      <div className={`comp-row ${hasDiff ? "has-diff" : "is-identical"}`}>
                        <div className="cell-attr">Quarterly Installment (Est.)</div>
                        {properties.map((p) => {
                          const quarterly = Math.round((Number(p.price) * 0.8) / 28);
                          return (
                            <div key={`qtr-${p.id}`} className="cell-prop">
                              <span className="val-mono">{formatPrice(quarterly)} / qtr</span>
                              <span className="val-sub">Based on 7-yr schedule (28 payments)</span>
                            </div>
                          );
                        })}
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                            <span className="val-mono font-semibold text-[#131D36]">
                              {p.listingIntent === "SALE" ? "Outright Ownership (Sale)" : "Primary Leasehold (Rent)"}
                            </span>
                            <span className="val-sub">Registered title</span>
                          </div>
                        ))}
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                              {Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
                                ? `${Number(p.latitude).toFixed(4)}° N, ${Number(p.longitude).toFixed(4)}° E`
                                : "30.0155° N, 31.4880° E"}
                            </span>
                            <span className="val-sub">High precision geodetic pin</span>
                          </div>
                        ))}
                        {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                          {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                      {properties.length < 4 && <div className="cell-prop bg-canvas" />}
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
                            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold text-center hover:bg-navy-800 transition"
                          >
                            Full Property Dossier →
                          </Link>
                          <a
                            href={`mailto:advisory@settly.estate?subject=Private%20Viewing%20Request%3A%20${encodeURIComponent(p.titleEn)}`}
                            className="px-4 py-2 bg-white border border-[rgba(30,42,74,0.18)] text-navy-900 rounded-lg text-xs font-bold text-center hover:bg-canvas transition"
                          >
                            Schedule Private Viewing
                          </a>
                        </div>
                      </div>
                    ))}
                    {properties.length < 4 && <div className="cell-prop bg-canvas" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Floating Quick-Bar */}
      {!loading && !error && properties.length >= 2 && (
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
          {loadingCatalog ? (
            <div className="py-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-[#C69749] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs text-ink-3">Loading available residences...</p>
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
                  <Image
                    src={item.coverImage || "/images/properties/property-1.jpg"}
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F6F3] p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#C69749] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-serif text-lg text-[#131D36]">Loading Settly Comparison Matrix...</p>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
