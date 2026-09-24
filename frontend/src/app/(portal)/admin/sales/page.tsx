"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gavel,
  KeyRound,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { problemMessage } from "@/api/errors";
import {
  adminSalesListQuery,
  useAdminConfirmSaleMutation,
  useAdminFellThroughSaleMutation,
  useAdminExtendSaleReviewMutation,
} from "@/lib/query/sales";
import type {
  AdminSaleItem,
  AdminSaleTab,
  AdminFellThroughSaleInput,
} from "@/api/sales";
import { AdminSaleCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toaster";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";

const TABS: { key: AdminSaleTab; label: string }[] = [
  { key: "ACTION_REQUIRED", label: "Action Required" },
  { key: "ACTIVE", label: "Active Reservations" },
  { key: "RESOLVED", label: "Resolved Deals" },
];

function AdminSalesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (params.get("tab") as AdminSaleTab) || "ACTION_REQUIRED";
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(params.get("search") || "");
  const [selectedSale, setSelectedSale] = useState<AdminSaleItem | null>(null);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const query = useInfiniteQuery(adminSalesListQuery(currentTab, activeSearch || undefined));
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const counts = query.data?.pages[0]?.counts ?? {
    actionRequired: 0,
    active: 0,
    resolved: 0,
  };

  const handleTabChange = (tab: AdminSaleTab) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    const next = new URLSearchParams(params.toString());
    if (searchInput.trim()) {
      next.set("search", searchInput.trim());
    } else {
      next.delete("search");
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="portal-content max-w-[1440px] space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-brass-600" aria-hidden />
            <h1 className="font-display text-2xl text-navy-900">
              Sales & Conveyance Review
            </h1>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Two-Party Sale Adjudication Queue (`ADM-07`, Transitions P9, P9a, P10, O13, O14).
          </p>
        </div>
        <div className="text-xs text-ink-3">
          Conflict-of-Interest Guard (#67, #71) Enforced
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div role="tablist" aria-label="Sales review queue" className="flex gap-2">
          {TABS.map((t) => {
            const count =
              t.key === "ACTION_REQUIRED"
                ? counts.actionRequired
                : t.key === "ACTIVE"
                ? counts.active
                : counts.resolved;

            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={t.key === currentTab}
                onClick={() => handleTabChange(t.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  t.key === currentTab
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-canvas border border-line text-ink-2 hover:bg-white"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                    t.key === currentTab
                      ? t.key === "ACTION_REQUIRED" && count > 0
                        ? "bg-red-500 text-white"
                        : "bg-white/20 text-white"
                      : t.key === "ACTION_REQUIRED" && count > 0
                      ? "bg-red-100 text-red-700"
                      : "bg-line/60 text-ink-3"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, buyer, agent..."
            className="w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-xs text-navy-900 placeholder:text-ink-4 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-4" aria-hidden />
        </form>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {query.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AdminSaleCardSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-line bg-white p-4 text-xs text-error">
            {problemMessage(query.error)}{" "}
            <button
              type="button"
              className="font-semibold underline text-navy-900"
              onClick={() => query.refetch()}
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Scale className="h-6 w-6 text-brass-600" />}
            title="No cases in this queue"
            description={
              currentTab === "ACTION_REQUIRED"
                ? "All active conveyances are progressing smoothly within their 30-day window without disputes."
                : "No deals found matching your selected criteria."
            }
          />
        ) : (
          items.map((sale) => (
            <AdminSaleRow
              key={sale.id}
              sale={sale}
              onSelect={() => setSelectedSale(sale)}
            />
          ))
        )}

        {query.hasNextPage && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              isLoading={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
              className="text-xs"
            >
              Load more cases
            </Button>
          </div>
        )}
      </div>

      {/* Adjudication Drawer */}
      {selectedSale && (
        <AdminAdjudicationDrawer
          sale={selectedSale}
          currentUserId={currentUserId}
          onClose={() => {
            setSelectedSale(null);
            query.refetch();
          }}
        />
      )}
    </div>
  );
}

function AdminSaleRow({
  sale,
  onSelect,
}: {
  sale: AdminSaleItem;
  onSelect: () => void;
}) {
  const buyerConfirmed = Boolean(sale.buyerConfirmedAt);
  const agentConfirmed = Boolean(sale.agentConfirmedAt);

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl border bg-white p-4 transition-all hover:border-brass hover:shadow-md ${
        sale.requiresAction ? "border-amber-300 bg-amber-50/20" : "border-line"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Thumbnail & Property Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas">
            <Image
              src={sale.property.imageUrl || PLACEHOLDER_PROPERTY_IMAGE}
              alt={sale.property.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-navy-900 group-hover:text-brass-600 transition-colors">
                {sale.property.title}
              </span>
              {sale.isDisputed && (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  <ShieldAlert className="h-3 w-3" />
                  DISPUTED
                </span>
              )}
              {sale.isDeadlinePassed && !sale.isDisputed && sale.status === "RESERVED" && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Clock className="h-3 w-3" />
                  OVERDUE (Day {sale.daysElapsed})
                </span>
              )}
              {sale.status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <ShieldCheck className="h-3 w-3" />
                  SOLD
                </span>
              )}
              {sale.status === "FELL_THROUGH" && (
                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-ink-3">
                  <XCircle className="h-3 w-3" />
                  FELL THROUGH
                </span>
              )}
            </div>

            {/* Financial & Timeline Subline */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
              <span className="font-mono font-bold text-navy-900">
                {sale.agreedPrice.toLocaleString("en-US")} EGP
              </span>
              <span>•</span>
              <span>
                Deposit:{" "}
                <span className="font-mono font-semibold text-ink-2">
                  {sale.depositAmount.toLocaleString("en-US")} EGP
                </span>
              </span>
              <span>•</span>
              <span>
                Reserved:{" "}
                {sale.reservationDate
                  ? new Date(sale.reservationDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Confirmation Status & CTA */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-line">
          {/* Confirmations breakdown */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                buyerConfirmed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-canvas text-ink-3 border border-line"
              }`}
            >
              <User className="h-3 w-3" />
              <span>Buyer</span>
              {buyerConfirmed ? <CheckCircle2 className="h-3 w-3" /> : "—"}
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                agentConfirmed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-canvas text-ink-3 border border-line"
              }`}
            >
              <span>Agent</span>
              {agentConfirmed ? <CheckCircle2 className="h-3 w-3" /> : "—"}
            </div>
          </div>

          <Button
            size="sm"
            variant={sale.requiresAction ? "primary" : "outline"}
            className={
              sale.requiresAction
                ? "bg-brass hover:bg-brass-600 text-navy-900 font-bold text-xs"
                : "text-xs"
            }
          >
            <Gavel className="mr-1 h-3.5 w-3.5" />
            Adjudicate
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminAdjudicationDrawer({
  sale,
  currentUserId,
  onClose,
}: {
  sale: AdminSaleItem;
  currentUserId?: string;
  onClose: () => void;
}) {
  const [activeAction, setActiveAction] = useState<"CONFIRM" | "FELL_THROUGH" | "EXTEND">("CONFIRM");
  const [confirmNotes, setConfirmNotes] = useState("");
  const [fellCause, setFellCause] = useState<string>("EXTERNAL_COLLAPSE");
  const [fellReason, setFellReason] = useState("");
  const [fellNotes, setFellNotes] = useState("");
  const [extendDays, setExtendDays] = useState(14);
  const [extendNotes, setExtendNotes] = useState("");

  const confirmMutation = useAdminConfirmSaleMutation();
  const fellThroughMutation = useAdminFellThroughSaleMutation();
  const extendMutation = useAdminExtendSaleReviewMutation();

  // Conflict-of-Interest Guard (#67, #71)
  const isConflicted = currentUserId === sale.buyer.id || currentUserId === sale.agent.id;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmNotes.trim().length < 5 || isConflicted) return;

    confirmMutation.mutate(
      { offerId: sale.id, input: { notes: confirmNotes.trim() } },
      {
        onSuccess: () => {
          toast.success("Sale confirmed! Property transitioned to SOLD (P9, O13).");
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleFellThrough = (e: React.FormEvent) => {
    e.preventDefault();
    if (fellReason.trim().length < 5 || isConflicted) return;

    fellThroughMutation.mutate(
      {
        offerId: sale.id,
        input: {
          cause: fellCause as AdminFellThroughSaleInput["cause"],
          reason: fellReason.trim(),
          notes: fellNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Sale marked fell through. Property returned to PUBLISHED (P10, O14).");
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (extendNotes.trim().length < 5 || isConflicted) return;

    extendMutation.mutate(
      {
        offerId: sale.id,
        input: {
          extensionDays: Number(extendDays),
          notes: extendNotes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success(`Review deadline extended by ${extendDays} days.`);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-brass-600" />
              <h2 className="font-display text-lg text-navy-900">
                Adjudicate Conveyance Case
              </h2>
            </div>
            <span className="text-xs text-ink-3 font-mono">Offer ID: {sale.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Conflict of Interest Warning (#67, #71) */}
          {isConflicted && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <span>Conflict of Interest Detected (#67, #71)</span>
              </div>
              <p className="leading-relaxed">
                You are registered as the{" "}
                <strong>{currentUserId === sale.buyer.id ? "buyer" : "listing agent"}</strong> in
                this transaction. Under Settly Corporate Governance Rules, administrators cannot
                adjudicate transactions they are party to.
              </p>
              <div className="font-semibold text-red-800">
                All adjudication controls are locked. Another administrator must resolve this case.
              </div>
            </div>
          )}

          {/* Deal Summary Card */}
          <div className="rounded-xl border border-line bg-canvas p-4 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-navy-900">{sale.property.title}</h3>
                <Link
                  href={`/properties/${sale.property.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-mono text-brass-600 hover:underline mt-0.5"
                >
                  View public property <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <span className="font-mono text-sm font-bold text-navy-900">
                {sale.agreedPrice.toLocaleString("en-US")} EGP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-ink-2">
              <div>
                <span className="text-ink-3">Buyer:</span>{" "}
                <span className="font-semibold text-navy-900">{sale.buyer.name}</span>
                <div className="font-mono text-[11px] text-ink-3">{sale.buyer.email}</div>
              </div>
              <div>
                <span className="text-ink-3">Listing Agent:</span>{" "}
                <span className="font-semibold text-navy-900">{sale.agent.name}</span>
                <div className="font-mono text-[11px] text-ink-3">{sale.agent.email}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-ink-2">
              <div>
                <span className="text-ink-3">Reservation Date:</span>{" "}
                <span className="font-mono">
                  {sale.reservationDate
                    ? new Date(sale.reservationDate).toLocaleDateString("en-US")
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-ink-3">Review Deadline:</span>{" "}
                <span className="font-mono">
                  {sale.adminReviewDeadline
                    ? new Date(sale.adminReviewDeadline).toLocaleDateString("en-US")
                    : "30-day standard"}
                </span>
              </div>
            </div>
          </div>

          {/* Reported Dispute Details */}
          {sale.isDisputed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldAlert className="h-4 w-4" />
                <span>Dispute Details Filed on Record</span>
              </div>
              <p className="rounded-lg bg-white/80 p-3 italic text-ink-1 border border-amber-200/60 leading-relaxed">
                &quot;{sale.disputeReason}&quot;
              </p>
              <div className="text-[11px] text-amber-700">
                Filed at:{" "}
                {sale.disputedAt ? new Date(sale.disputedAt).toLocaleString("en-US") : "N/A"}
              </div>
            </div>
          )}

          {/* Adjudication Decision Selector */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-navy-900">
              Administrative Determination
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isConflicted}
                onClick={() => setActiveAction("CONFIRM")}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold border transition ${
                  activeAction === "CONFIRM"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-line bg-canvas text-ink-2 hover:bg-white"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Confirm Sale</span>
              </button>

              <button
                type="button"
                disabled={isConflicted}
                onClick={() => setActiveAction("FELL_THROUGH")}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold border transition ${
                  activeAction === "FELL_THROUGH"
                    ? "border-red-600 bg-red-50 text-red-900"
                    : "border-line bg-canvas text-ink-2 hover:bg-white"
                }`}
              >
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Fell Through</span>
              </button>

              <button
                type="button"
                disabled={isConflicted}
                onClick={() => setActiveAction("EXTEND")}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-semibold border transition ${
                  activeAction === "EXTEND"
                    ? "border-brass-600 bg-brass-50 text-navy-900"
                    : "border-line bg-canvas text-ink-2 hover:bg-white"
                }`}
              >
                <Calendar className="h-4 w-4 text-brass-600" />
                <span>Extend Period</span>
              </button>
            </div>

            {/* ACTION 1: CONFIRM SALE FORM */}
            {activeAction === "CONFIRM" && (
              <form onSubmit={handleConfirm} className="rounded-xl border border-line p-4 space-y-3">
                <div className="text-xs text-ink-2">
                  Confirming this transaction transitions the offer to{" "}
                  <strong>COMPLETED</strong> and marks the property as <strong>SOLD</strong>. This
                  action qualifies the buyer lead per Decision #83.
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-900">
                    Verification Notes (min 5 characters)
                  </label>
                  <textarea
                    required
                    disabled={isConflicted}
                    minLength={5}
                    rows={3}
                    value={confirmNotes}
                    onChange={(e) => setConfirmNotes(e.target.value)}
                    placeholder="Enter audit notes (e.g. Notary certificate #8492 verified directly)..."
                    className="w-full mt-1 rounded-xl border border-line p-2.5 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isConflicted || confirmNotes.trim().length < 5}
                  isLoading={confirmMutation.isPending}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs py-2.5"
                >
                  <KeyRound className="mr-1.5 h-4 w-4 text-brass" />
                  Confirm Sale & Mark SOLD (P9, O13)
                </Button>
              </form>
            )}

            {/* ACTION 2: FELL THROUGH FORM */}
            {activeAction === "FELL_THROUGH" && (
              <form
                onSubmit={handleFellThrough}
                className="rounded-xl border border-line p-4 space-y-3"
              >
                <div className="text-xs text-ink-2">
                  Declaring the transaction fell through returns the property to{" "}
                  <strong>PUBLISHED</strong>. §7 deposit refund determinations apply based on cause.
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">Cause Determination</label>
                  <select
                    disabled={isConflicted}
                    value={fellCause}
                    onChange={(e) => setFellCause(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-line p-2 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  >
                    <option value="EXTERNAL_COLLAPSE">
                      External Collapse (Registry / Financing / Title defect)
                    </option>
                    <option value="SELLER_AGENT_WITHDRAWN">
                      Seller / Agent Withdrawn after Acceptance
                    </option>
                    <option value="BUYER_WITHDRAWN_WITHIN_48H">
                      Buyer Withdrawn within 48h (Full Refund)
                    </option>
                    <option value="BUYER_WITHDRAWN_AFTER_48H">
                      Buyer Withdrawn after 48h (Forfeited)
                    </option>
                    <option value="ADMIN_DETERMINATION">
                      Administrative Disqualification / Policy Breach
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">
                    Primary Reason (min 5 characters)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isConflicted}
                    minLength={5}
                    value={fellReason}
                    onChange={(e) => setFellReason(e.target.value)}
                    placeholder="e.g. Incurable title registry defect discovered"
                    className="w-full mt-1 rounded-xl border border-line p-2 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">Detailed Notes</label>
                  <textarea
                    disabled={isConflicted}
                    rows={2}
                    value={fellNotes}
                    onChange={(e) => setFellNotes(e.target.value)}
                    placeholder="Additional context for audit log and notifications..."
                    className="w-full mt-1 rounded-xl border border-line p-2.5 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isConflicted || fellReason.trim().length < 5}
                  isLoading={fellThroughMutation.isPending}
                  className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold text-xs py-2.5"
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Declare Fell Through & Relist (P10, O14)
                </Button>
              </form>
            )}

            {/* ACTION 3: EXTEND REVIEW FORM */}
            {activeAction === "EXTEND" && (
              <form onSubmit={handleExtend} className="rounded-xl border border-line p-4 space-y-3">
                <div className="text-xs text-ink-2">
                  Grants both parties additional time to resolve registry or notary hurdles without
                  cancelling the reservation.
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">
                    Extension Days (1–60)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    disabled={isConflicted}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="w-full mt-1 rounded-xl border border-line p-2 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">
                    Justification Notes (min 5 characters)
                  </label>
                  <textarea
                    required
                    disabled={isConflicted}
                    minLength={5}
                    rows={3}
                    value={extendNotes}
                    onChange={(e) => setExtendNotes(e.target.value)}
                    placeholder="Explain why extension was granted (e.g. Notary closed for national holidays)..."
                    className="w-full mt-1 rounded-xl border border-line p-2.5 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isConflicted || extendNotes.trim().length < 5}
                  isLoading={extendMutation.isPending}
                  className="w-full bg-brass hover:bg-brass-600 text-navy-900 font-bold text-xs py-2.5"
                >
                  <Calendar className="mr-1.5 h-4 w-4" />
                  Extend Review Deadline
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSalesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-6" aria-busy="true" aria-label="Loading sales desk">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 font-display" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AdminSaleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <AdminSalesContent />
    </Suspense>
  );
}
