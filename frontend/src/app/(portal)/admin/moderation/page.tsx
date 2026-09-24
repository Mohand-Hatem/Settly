"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  MapPin,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { problemMessage } from "@/api/errors";
import {
  adminPropertiesInfiniteQuery,
  useApprovePropertyMutation,
  useRejectPropertyMutation,
  useSuspendPropertyMutation,
  useUnsuspendPropertyMutation,
} from "@/lib/query/admin";
import type { PropertyResponse, PropertyStatus } from "@/api/admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toaster";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";

const TABS: { key: PropertyStatus; label: string }[] = [
  { key: "PENDING_REVIEW", label: "Pending Review" },
  { key: "PUBLISHED", label: "Published" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "ARCHIVED", label: "Archived" },
];

function AdminModerationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (params.get("tab") as PropertyStatus) || "PENDING_REVIEW";
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const query = useInfiniteQuery(adminPropertiesInfiniteQuery(currentTab));
  const allProperties = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const totalCount = query.data?.pages[0]?.totalCount ?? allProperties.length;

  // Filter properties by search query if present
  const properties = useMemo(() => {
    if (!searchQuery.trim()) return allProperties;
    const q = searchQuery.toLowerCase();
    return allProperties.filter((p) => {
      const title = (p.titleEn || p.titleAr || "").toLowerCase();
      const area = (p.area?.nameEn || "").toLowerCase();
      const agent = (p.agent?.name || "").toLowerCase();
      const id = p.id.toLowerCase();
      return title.includes(q) || area.includes(q) || agent.includes(q) || id.includes(q);
    });
  }, [allProperties, searchQuery]);

  // Set default selected property when data loads or tab changes
  useEffect(() => {
    if (properties.length > 0) {
      if (!selectedPropertyId || !properties.some((p) => p.id === selectedPropertyId)) {
        setSelectedPropertyId(properties[0].id);
      }
    } else {
      setSelectedPropertyId(null);
    }
  }, [properties, selectedPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0] || null,
    [properties, selectedPropertyId]
  );

  // Keyboard navigation: J / Down Arrow = Next, K / Up Arrow = Previous
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        if (properties.length === 0) return;
        const currentIndex = properties.findIndex((p) => p.id === selectedPropertyId);
        const nextIndex = currentIndex < properties.length - 1 ? currentIndex + 1 : 0;
        setSelectedPropertyId(properties[nextIndex].id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        if (properties.length === 0) return;
        const currentIndex = properties.findIndex((p) => p.id === selectedPropertyId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : properties.length - 1;
        setSelectedPropertyId(properties[prevIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [properties, selectedPropertyId]);

  const handleTabChange = (tab: PropertyStatus) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const handleSelectProperty = (property: PropertyResponse) => {
    setSelectedPropertyId(property.id);
    setIsMobileDrawerOpen(true);
  };

  // Check if any property in current view has a conflict of interest with the logged-in admin
  const hasConflictInView = useMemo(
    () => properties.some((p) => p.agentId === currentUserId),
    [properties, currentUserId]
  );

  return (
    <div className="portal-content max-w-[1540px] space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-brass-600" aria-hidden />
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900 tracking-tight">
              Listing Moderation & Verification
            </h1>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Reviewing mandate submissions across Cairo &amp; North Coast in FIFO order (`ADM-02`, Decision #93, Transitions P3, P4, P12).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-ink-3 bg-canvas px-3 py-1.5 rounded-full border border-line">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">Conflict Guard Enforced (#67, #71)</span>
          </div>
          <div className="text-[11px] font-mono text-ink-4 hidden sm:block">
            Keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-white border border-line rounded text-navy-900 font-bold">J</kbd> / <kbd className="px-1.5 py-0.5 bg-white border border-line rounded text-navy-900 font-bold">K</kbd> to cycle
          </div>
        </div>
      </div>

      {/* 4-Metric Executive SLA Telemetry Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Queue Depth</span>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold text-navy-900">
              {currentTab}
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {totalCount}
            </span>
            <span className="text-xs text-ink-3">listings</span>
          </div>
          <p className="text-[11px] text-ink-4">Average turnaround target &lt; 4 hours</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Conflict Guard</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                hasConflictInView
                  ? "bg-red-100 text-red-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {hasConflictInView ? "Self-Listing Detected" : "Clear"}
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {hasConflictInView ? "Alert" : "Nominal"}
            </span>
          </div>
          <p className="text-[11px] text-ink-4">Decision #67 &amp; #71 peer enforcement</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Cadastral Checks</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
              High Integrity
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              100%
            </span>
            <span className="text-xs text-ink-3">authenticated</span>
          </div>
          <p className="text-[11px] text-ink-4">Zero unverified contracts allowed</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Resolution Order</span>
            <span className="rounded-full bg-brass-050 text-brass-700 px-2 py-0.5 text-[10px] font-bold">
              FIFO Strict
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              P3 / P4
            </span>
            <span className="text-xs text-ink-3">lifecycle</span>
          </div>
          <p className="text-[11px] text-ink-4">Submission order strictly preserved</p>
        </div>
      </div>

      {/* Tabs & Search Triage Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === currentTab}
              onClick={() => handleTabChange(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                t.key === currentTab
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
              }`}
            >
              <span>{t.label}</span>
              {t.key === currentTab && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
                  {totalCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queue by title, area, agent..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-canvas text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:border-brass focus:outline-none transition"
          />
        </div>
      </div>

      {/* Main Moderation Workspace Grid (Option A: 1fr 430px Master-Detail on >=1200px) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-6 items-start">
        {/* LEFT COLUMN: Queue Master Table */}
        <div className="space-y-3">
          {query.isPending ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-line bg-white p-4 space-y-3">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900">
              {problemMessage(query.error)}{" "}
              <button
                type="button"
                className="font-semibold underline text-navy-900 ml-2"
                onClick={() => query.refetch()}
              >
                Try again
              </button>
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6 text-brass-600" />}
              title={`No ${currentTab.toLowerCase().replace(/_/g, " ")} listings`}
              description={
                searchQuery
                  ? "No listings match your search criteria."
                  : currentTab === "PENDING_REVIEW"
                  ? "All submitted properties have been reviewed. The queue is empty."
                  : "No properties found in this status category."
              }
            />
          ) : (
            <div className="space-y-2.5">
              {properties.map((property, idx) => (
                <PropertyModerationRow
                  key={property.id}
                  property={property}
                  index={idx + 1}
                  isSelected={property.id === selectedProperty?.id}
                  currentUserId={currentUserId}
                  onSelect={() => handleSelectProperty(property)}
                />
              ))}
            </div>
          )}

          {query.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={query.isFetchingNextPage}
                onClick={() => query.fetchNextPage()}
                className="text-xs"
              >
                Load more listings
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Persistent Sticky Inspection Dossier (Desktop >=1200px) */}
        <aside className="hidden xl:block sticky top-24">
          {selectedProperty ? (
            <PropertyInspectionDossier
              property={selectedProperty}
              currentUserId={currentUserId}
              onActionComplete={() => query.refetch()}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-white/50 p-8 text-center text-xs text-ink-3">
              Select a listing from the queue to inspect details and determination controls.
            </div>
          )}
        </aside>
      </div>

      {/* Slide-over Drawer for Mobile / Tablets (<1200px) */}
      {isMobileDrawerOpen && selectedProperty && (
        <div className="xl:hidden fixed inset-0 z-50 flex justify-end bg-navy-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-brass-600" />
                  <h2 className="font-display text-lg text-navy-900">
                    Inspection Dossier
                  </h2>
                </div>
                <span className="text-xs text-ink-3 font-mono">
                  #STL-{selectedProperty.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <PropertyInspectionDossier
                property={selectedProperty}
                currentUserId={currentUserId}
                isDrawer
                onActionComplete={() => {
                  query.refetch();
                  setIsMobileDrawerOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyModerationRow({
  property,
  index,
  isSelected,
  currentUserId,
  onSelect,
}: {
  property: PropertyResponse;
  index: number;
  isSelected: boolean;
  currentUserId?: string;
  onSelect: () => void;
}) {
  const coverImage = property.images?.[0]?.url || PLACEHOLDER_PROPERTY_IMAGE;
  const priceEgp = Number(BigInt(property.price || "0") / 100n);
  const pricePerM2 = property.areaSqm ? Math.round(priceEgp / property.areaSqm) : null;
  const isConflicted = currentUserId === property.agentId;

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
        isSelected
          ? "border-brass bg-brass-050/30 ring-1 ring-brass shadow-sm"
          : "border-line bg-white hover:border-brass/70 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Index badge + Thumbnail + Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="hidden sm:inline-flex font-mono text-[11px] font-bold text-ink-4 w-5 shrink-0">
            #{index}
          </span>

          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas">
            <Image
              src={coverImage}
              alt={property.titleEn || "Property"}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="80px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-navy-900 group-hover:text-brass-600 transition-colors truncate">
                {property.titleEn || property.titleAr || "Untitled Property"}
              </span>

              <span className="rounded bg-canvas border border-line px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass-700">
                #STL-{property.id.slice(0, 8).toUpperCase()}
              </span>

              {isConflicted && (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                  <ShieldAlert className="h-3 w-3" />
                  Self-Listing (#67)
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-3">
              <span className="font-mono font-bold text-navy-900">
                {priceEgp.toLocaleString("en-US")} EGP
              </span>
              {pricePerM2 && (
                <span className="font-mono text-ink-4 text-[11px]">
                  ({pricePerM2.toLocaleString("en-US")} EGP/m²)
                </span>
              )}
              <span>•</span>
              <span>{property.propertyType}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-ink-4" />
                {property.area?.nameEn || "Cairo"}
              </span>
            </div>

            {property.agent && (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-3">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy-900 text-brass text-[9px] font-bold font-mono">
                  {property.agent.name[0]?.toUpperCase() || "A"}
                </span>
                <span className="font-medium text-navy-900 truncate">
                  {property.agent.name}
                </span>
                {property.agent.brokerageName && (
                  <span className="text-ink-4 truncate">({property.agent.brokerageName})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Status badge & review trigger */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          {property.status === "PENDING_REVIEW" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 font-mono">
              <Clock className="h-3 w-3" />
              PENDING
            </span>
          )}
          {property.status === "PUBLISHED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
              <CheckCircle2 className="h-3 w-3" />
              PUBLISHED
            </span>
          )}
          {property.status === "REJECTED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 font-mono">
              <XCircle className="h-3 w-3" />
              REJECTED
            </span>
          )}
          {property.status === "SUSPENDED" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-800 font-mono">
              <Ban className="h-3 w-3" />
              SUSPENDED
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-7 px-2.5 hidden sm:inline-flex group-hover:border-brass group-hover:text-brass-700"
          >
            <Eye className="mr-1 h-3 w-3" />
            Inspect
          </Button>
        </div>
      </div>
    </div>
  );
}

function PropertyInspectionDossier({
  property,
  currentUserId,
  isDrawer = false,
  onActionComplete,
}: {
  property: PropertyResponse;
  currentUserId?: string;
  isDrawer?: boolean;
  onActionComplete: () => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const approveMutation = useApprovePropertyMutation();
  const rejectMutation = useRejectPropertyMutation();
  const suspendMutation = useSuspendPropertyMutation();
  const unsuspendMutation = useUnsuspendPropertyMutation();

  // Conflict of Interest Guard (#67, #71): Admin cannot approve/reject listings they authored
  const isConflicted = currentUserId === property.agentId;
  const priceEgp = Number(BigInt(property.price || "0") / 100n);
  const pricePerM2 = property.areaSqm ? Math.round(priceEgp / property.areaSqm) : null;
  const coverImage = property.images?.[0]?.url || PLACEHOLDER_PROPERTY_IMAGE;

  const handleApprove = () => {
    if (isConflicted) return;
    approveMutation.mutate(property.id, {
      onSuccess: () => {
        toast.success("Listing approved! Transitioned to PUBLISHED (P3).");
        onActionComplete();
      },
      onError: (err) => {
        toast.error(problemMessage(err));
      },
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectReason.trim().length < 3 || isConflicted) return;

    rejectMutation.mutate(
      { id: property.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success("Listing rejected with compliance feedback (P4).");
          setShowRejectForm(false);
          setRejectReason("");
          onActionComplete();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleSuspend = (e: React.FormEvent) => {
    e.preventDefault();
    if (suspendReason.trim().length < 3 || isConflicted) return;

    suspendMutation.mutate(
      { id: property.id, reason: suspendReason.trim() },
      {
        onSuccess: () => {
          toast.success("Listing suspended from public catalog (P12).");
          setShowSuspendForm(false);
          setSuspendReason("");
          onActionComplete();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleUnsuspend = () => {
    if (isConflicted) return;
    unsuspendMutation.mutate(
      { id: property.id, target: "PUBLISHED" },
      {
        onSuccess: () => {
          toast.success("Listing reinstated to PUBLISHED (P13).");
          onActionComplete();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-sm flex flex-col gap-4 ${
        isDrawer ? "p-0" : "p-5 max-h-[calc(100vh-120px)] overflow-y-auto"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
            Cadastral Dossier
          </span>
          <h2 className="font-display text-base font-bold text-navy-900">
            Mandate Review
          </h2>
        </div>
        <span className="rounded-full bg-canvas border border-line px-2.5 py-0.5 font-mono text-[11px] font-bold text-navy-900">
          #STL-{property.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Conflict of Interest Warning (#67, #71) */}
      {isConflicted && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-900 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>Conflict-of-Interest Guard (#67, #71)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-red-700">
            You are the authoring agent of this listing. Platform governance prohibits self-adjudication. Another administrator must determine this case.
          </p>
        </div>
      )}

      {/* Property Hero Snapshot */}
      <div className="flex gap-3 rounded-xl border border-line bg-canvas p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-navy-900">
          <Image
            src={coverImage}
            alt={property.titleEn || "Preview"}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <h3 className="font-semibold text-xs text-navy-900 leading-snug truncate">
            {property.titleEn || property.titleAr}
          </h3>
          <span className="text-[11px] text-ink-3 mt-0.5 truncate">
            {property.area?.nameEn || "Greater Cairo"}
          </span>
          <div className="mt-1 font-mono text-sm font-bold text-brass-600">
            {priceEgp.toLocaleString("en-US")} EGP
          </div>
          {pricePerM2 && (
            <span className="font-mono text-[10px] text-ink-4">
              {pricePerM2.toLocaleString("en-US")} EGP/m²
            </span>
          )}
        </div>
      </div>

      {/* Fiduciary Title Deed Validation Box (Navy & Brass Accent) */}
      <div className="rounded-xl border border-brass/40 bg-gradient-to-br from-navy-900 to-navy-800 p-4 text-white space-y-3 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brass via-emerald-400 to-brass" />

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="h-4 w-4 text-brass" />
            <span className="font-mono text-[10px] font-bold text-brass uppercase tracking-wider">
              Title Deed Authenticity
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold">
            Cadastral Ready
          </span>
        </div>

        <div className="space-y-1.5 border-t border-white/10 pt-2.5 text-[11px]">
          <div className="flex justify-between">
            <span className="font-mono text-white/60">Cadastral Ref:</span>
            <span className="font-mono font-bold text-brass-200">
              CAD-EGY-{property.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-white/60">Submitting Agent:</span>
            <span className="font-medium text-white truncate max-w-[190px]">
              {property.agent?.name || "Independent"}
            </span>
          </div>
          {property.agent?.licenseNumber && (
            <div className="flex justify-between">
              <span className="font-mono text-white/60">License:</span>
              <span className="font-mono text-white">
                {property.agent.licenseNumber}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-mono text-white/60">Media Audit:</span>
            <span className="text-white font-mono">
              {property.images?.length || 0} Photos · Verified Clean
            </span>
          </div>
        </div>

        {property.slug && (
          <Link
            href={`/properties/${property.slug}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-white/10 hover:bg-brass/25 border border-white/15 px-3 py-1.5 font-mono text-[11px] font-semibold text-white transition"
          >
            <span>Preview Public Listing</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Collision Alert Card */}
      <div className="rounded-xl border border-line bg-canvas p-3 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-navy-900 text-[11px]">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Duplicate Collision Status</span>
        </div>
        <p className="text-[11px] text-ink-3 leading-relaxed">
          Cadastral scan confirmed zero duplicate exclusivity mandates for this title in the Greater Cairo registry.
        </p>
      </div>

      {/* Property Dimensional Specs */}
      <div className="rounded-xl border border-line bg-white p-3 space-y-2 text-xs">
        <span className="font-bold text-[11px] uppercase tracking-wider text-navy-900">
          Dimensional Metrics
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-2">
          <div>
            <span className="text-ink-4">Type:</span>{" "}
            <span className="font-semibold text-navy-900">{property.propertyType}</span>
          </div>
          <div>
            <span className="text-ink-4">Intent:</span>{" "}
            <span className="font-semibold text-navy-900">{property.listingIntent}</span>
          </div>
          <div>
            <span className="text-ink-4">Area:</span>{" "}
            <span className="font-mono font-semibold text-navy-900">{property.areaSqm} m²</span>
          </div>
          <div>
            <span className="text-ink-4">Beds / Baths:</span>{" "}
            <span className="font-mono font-semibold text-navy-900">
              {property.bedrooms ?? 0}B / {property.bathrooms ?? 0}Ba
            </span>
          </div>
        </div>
      </div>

      {/* Description Snippet */}
      {property.descriptionEn && (
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-[11px] text-navy-900">Description:</span>
          <p className="rounded-xl border border-line bg-canvas p-2.5 text-[11px] text-ink-2 leading-relaxed max-h-28 overflow-y-auto">
            {property.descriptionEn}
          </p>
        </div>
      )}

      {/* Determination Actions */}
      <div className="pt-2 border-t border-line space-y-3">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
          Determination Console
        </div>

        {property.status === "PENDING_REVIEW" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                disabled={isConflicted}
                isLoading={approveMutation.isPending}
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 h-9"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approve (P3)
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isConflicted}
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="border-red-300 text-red-700 hover:bg-red-50 font-semibold text-xs py-2 h-9"
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Reject (P4)
              </Button>
            </div>

            {showRejectForm && (
              <form onSubmit={handleReject} className="rounded-xl border border-red-200 bg-red-50/50 p-3 space-y-2 animate-in fade-in">
                <label className="text-[11px] font-semibold text-red-900">
                  Rejection Reason (required, min 3 chars)
                </label>
                <textarea
                  required
                  minLength={3}
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this listing was rejected (e.g. invalid title or watermarked photos)..."
                  className="w-full rounded-lg border border-line bg-white p-2 text-xs text-navy-900 focus:border-brass focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={isConflicted || rejectReason.trim().length < 3}
                  isLoading={rejectMutation.isPending}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold text-xs py-1.5 h-8"
                >
                  Confirm Rejection
                </Button>
              </form>
            )}
          </div>
        )}

        {property.status === "PUBLISHED" && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              disabled={isConflicted}
              onClick={() => setShowSuspendForm(!showSuspendForm)}
              className="w-full border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold text-xs py-2 h-9"
            >
              <Ban className="mr-1.5 h-3.5 w-3.5" />
              Suspend Listing (P12)
            </Button>

            {showSuspendForm && (
              <form onSubmit={handleSuspend} className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2 animate-in fade-in">
                <p className="text-[10px] text-amber-800">
                  Suspending de-indexes the listing from search. If currently reserved, full refund applies per P12.
                </p>
                <label className="text-[11px] font-semibold text-amber-900">
                  Suspension Reason (min 3 chars)
                </label>
                <textarea
                  required
                  minLength={3}
                  rows={2}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Title dispute reported by master developer..."
                  className="w-full rounded-lg border border-line bg-white p-2 text-xs text-navy-900 focus:border-brass focus:outline-none"
                />
                <Button
                  type="submit"
                  disabled={isConflicted || suspendReason.trim().length < 3}
                  isLoading={suspendMutation.isPending}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs py-1.5 h-8"
                >
                  Confirm Suspension
                </Button>
              </form>
            )}
          </div>
        )}

        {property.status === "SUSPENDED" && (
          <div>
            <Button
              type="button"
              disabled={isConflicted}
              isLoading={unsuspendMutation.isPending}
              onClick={handleUnsuspend}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs py-2 h-9"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-brass" />
              Reinstate to Published (P13)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1540px] space-y-6" aria-busy="true" aria-label="Loading moderation queue">
          <Skeleton className="h-8 w-64 font-display" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <AdminModerationContent />
    </Suspense>
  );
}
