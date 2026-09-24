"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  CalendarDays,
  Compass,
  HandCoins,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { propertyListQuery } from "@/lib/query/catalog";
import { formatEGP } from "@/lib/money";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import type { PropertyResponse } from "@/api/catalog";

const formatNumber = (n: number) => n.toLocaleString("en-US");

type TabKey = "favorites" | "searches";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: string;
  frequency: string;
  createdAt: string;
}

function BuyerSavedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") === "searches" ? "searches" : "favorites") as TabKey;

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Keep state in sync with URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "searches" && activeTab !== "searches") {
      setActiveTab("searches");
    } else if (!tabParam && activeTab !== "favorites") {
      setActiveTab("favorites");
    }
  }, [searchParams, activeTab]);

  const { data: catalogData, isLoading } = useQuery(propertyListQuery({ limit: 50 }));

  // Load favorites & saved searches from localStorage
  useEffect(() => {
    try {
      const storedFavs = localStorage.getItem("settly_favorites");
      if (storedFavs) {
        setFavoriteIds(JSON.parse(storedFavs));
      }
      const storedSearches = localStorage.getItem("settly_saved_searches");
      if (storedSearches) {
        setSavedSearches(JSON.parse(storedSearches));
      }
    } catch {
      // Fallback empty
    }
    setIsLoaded(true);
  }, []);

  const handleTabChange = (newTab: TabKey) => {
    setActiveTab(newTab);
    if (newTab === "searches") {
      router.replace("/buyer/saved?tab=searches");
    } else {
      router.replace("/buyer/saved");
    }
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favoriteIds.filter((favId) => favId !== id);
    setFavoriteIds(updated);
    try {
      localStorage.setItem("settly_favorites", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRemoveSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    try {
      localStorage.setItem("settly_saved_searches", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const properties: PropertyResponse[] = catalogData?.items ?? [];
  const savedProperties = properties.filter((p) => favoriteIds.includes(p.id));

  // Category filter
  const filteredProperties = savedProperties.filter((p) => {
    if (categoryFilter === "all") return true;
    const loc = (p.area?.nameEn || "").toLowerCase();
    return loc.includes(categoryFilter.toLowerCase());
  });

  // Compute telemetry metrics in EGP (price is in piastres)
  const totalMonitoredValueEgp = savedProperties.reduce((sum, p) => {
    const egp = Number(p.price) / 100;
    return sum + (Number.isFinite(egp) ? egp : 0);
  }, 0);

  const avgPricePerM2 =
    savedProperties.length > 0
      ? Math.round(
          savedProperties.reduce((sum, p) => {
            const egp = Number(p.price) / 100;
            const rate = p.areaSqm > 0 ? egp / p.areaSqm : 0;
            return sum + rate;
          }, 0) / savedProperties.length
        )
      : 0;

  return (
    <div className="portal-content max-w-7xl mx-auto space-y-8">
      {/* Welcome Header & High Intent Actions */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Favorites &amp; Curated Collections</h1>
          <p>
            {savedProperties.length} saved residences · Total monitored value:{" "}
            {totalMonitoredValueEgp > 0 ? formatEGP(totalMonitoredValueEgp) : "EGP 0"}
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link href="/compare" className="btn-portal-outline">
            <span>Open Comparison Tool</span>
          </Link>
          <Link href="/search" className="btn-portal-brass">
            <Compass className="w-4 h-4 text-navy-950" />
            <span>Explore Properties</span>
          </Link>
        </div>
      </section>

      {/* Portfolio Valuation Telemetry Strip */}
      <section className="telemetry-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Monitored Portfolio Value</span>
            <span className="metric-badge-tag sage">Active</span>
          </div>
          <div className="metric-num-val">
            {totalMonitoredValueEgp > 0 ? formatEGP(totalMonitoredValueEgp) : "EGP 0"}
          </div>
          <div className="metric-footnote-txt">
            <span>Across {savedProperties.length} shortlisted residences</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Average Rate / m²</span>
            <span className="metric-badge-tag">Weighted</span>
          </div>
          <div className="metric-num-val">
            {avgPricePerM2 > 0 ? `EGP ${formatNumber(avgPricePerM2)}` : "—"}
            <span className="text-xs font-normal text-ink-3 ml-1.5">/ m²</span>
          </div>
          <div className="metric-footnote-txt">
            <span>Prime corridor weighted average</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Active Districts</span>
            <span className="metric-badge-tag brass">Coverage</span>
          </div>
          <div className="metric-num-val text-navy-900">
            {new Set(savedProperties.map((p) => p.area?.nameEn).filter(Boolean)).size}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Districts</span>
          </div>
          <div className="metric-footnote-txt">
            <Sparkles className="w-3.5 h-3.5 text-brass shrink-0" />
            <span>Across East &amp; West Cairo prime areas</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Active Search Radars</span>
            <span className="metric-badge-tag sage">Automated</span>
          </div>
          <div className="metric-num-val">
            {savedSearches.length}
            <span className="text-xs font-normal text-ink-3 ml-1.5">Radars</span>
          </div>
          <div className="metric-footnote-txt">
            <span>Automated alert matching</span>
          </div>
        </div>
      </section>

      {/* Control Bar: Tabs & Category Filter */}
      <section className="bg-white border border-line rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange("favorites")}
              className={`col-tab-btn ${activeTab === "favorites" ? "active" : ""}`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Favorite Residences</span>
              <span className="tab-count-badge">{savedProperties.length}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("searches")}
              className={`col-tab-btn ${activeTab === "searches" ? "active" : ""}`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Saved Search Queries</span>
              <span className="tab-count-badge">{savedSearches.length}</span>
            </button>
          </div>

          {activeTab === "favorites" && (
            <div className="flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-mono text-ink-3 uppercase text-[11px]">Corridor:</span>
              {[
                { id: "all", label: "All Corridors" },
                { id: "cairo", label: "New Cairo" },
                { id: "october", label: "West Cairo / Zayed" },
                { id: "coast", label: "North Coast" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`filter-pill ${categoryFilter === cat.id ? "active" : ""}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Tab 1: Favorites Grid */}
      {activeTab === "favorites" && (
        <section>
          {!isLoaded || isLoading ? (
            <div className="properties-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="fav-property-card p-4 space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-12 text-center">
              <EmptyState
                icon={<Bookmark className="h-8 w-8 text-brass-600" />}
                title={
                  savedProperties.length === 0
                    ? "No saved residences yet"
                    : "No residences matching this corridor"
                }
                description="Save residences you like while browsing the catalog to review their specifications and schedule private tours here."
                action={
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    <Compass className="h-4 w-4 text-brass" />
                    <span>Explore Verified Listings</span>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="properties-grid">
              {filteredProperties.map((prop) => {
                const coverImage = prop.images?.[0]?.url || PLACEHOLDER_PROPERTY_IMAGE;
                const priceEgp = Number(prop.price) / 100;
                const pricePerM2 =
                  prop.areaSqm > 0 ? Math.round(priceEgp / prop.areaSqm) : 0;

                return (
                  <article key={prop.id} className="fav-property-card">
                    <div className="card-media-shell">
                      <Image
                        src={coverImage}
                        alt={prop.titleEn || "Residence"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="card-top-tags">
                        <span className="card-dev-tag">
                          {prop.area?.nameEn || "Prime Corridor"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFavorite(prop.id)}
                        className="card-heart-btn"
                        title="Remove from favorites"
                        aria-label="Remove from favorites"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </button>
                      {pricePerM2 > 0 && (
                        <div className="card-price-m2-pill">
                          EGP {formatNumber(pricePerM2)} / m²
                        </div>
                      )}
                    </div>

                    <div className="card-body-content">
                      <div className="card-location-meta">
                        <span className="card-district flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brass-600" />
                          <span>{prop.area?.nameEn || "Greater Cairo"}</span>
                        </span>
                        <span className="card-collection-pill">
                          {prop.propertyType}
                        </span>
                      </div>

                      <h3 className="line-clamp-1">
                        <Link
                          href={`/properties/${prop.slug}`}
                          className="card-title-link"
                        >
                          {prop.titleEn || "Luxury Residence"}
                        </Link>
                      </h3>

                      <div className="card-price-value">
                        {formatEGP(priceEgp)}
                      </div>

                      <div className="card-specs-strip">
                        <span>{prop.bedrooms} Beds</span>
                        <span>·</span>
                        <span>{prop.bathrooms} Baths</span>
                        <span>·</span>
                        <span>{prop.areaSqm} m²</span>
                      </div>

                      <div className="card-bottom-actions">
                        <Link
                          href={`/properties/${prop.slug}#viewing`}
                          className="btn btn-outline text-xs flex-1 py-2"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>Request Viewing</span>
                        </Link>
                        <Link
                          href={`/properties/${prop.slug}#offer`}
                          className="btn btn-primary text-xs py-2"
                        >
                          <HandCoins className="w-3.5 h-3.5 text-brass" />
                          <span>Make Offer</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Saved Search Radars */}
      {activeTab === "searches" && (
        <>
          {savedSearches.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-12 text-center">
              <EmptyState
                icon={<Search className="h-8 w-8 text-brass-600" />}
                title="No Active Search Radars"
                description="Save custom search criteria and natural language queries from the discovery workspace to track new listings and price alerts."
                action={
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
                  >
                    <Compass className="h-4 w-4 text-brass" />
                    <span>Open Search Console</span>
                  </Link>
                }
              />
            </div>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="bg-white border border-line rounded-xl p-5 flex flex-col justify-between transition hover:border-brass/70 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-bold text-ink-3 uppercase">
                        {search.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSearch(search.id)}
                        className="text-ink-4 hover:text-red-500 transition p-1"
                        title="Remove Search Radar"
                        aria-label="Remove Search Radar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-navy-900">
                      {search.name}
                    </h3>
                    <p className="mt-2 text-xs text-ink-2 font-mono bg-canvas p-2.5 rounded-lg border border-line">
                      {search.filters}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-3 border-t border-line/60">
                    <span className="rounded-full border border-sage/30 bg-sage-bg px-2 py-0.5 font-mono text-[10px] font-bold text-sage">
                      {search.frequency}
                    </span>
                    <Link
                      href={`/search?q=${encodeURIComponent(search.query)}`}
                      className="btn btn-sm btn-primary"
                    >
                      <span>Execute Search</span>
                      <Search className="w-3 h-3 text-brass" />
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function BuyerSavedPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-workspace">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      }
    >
      <BuyerSavedContent />
    </Suspense>
  );
}
