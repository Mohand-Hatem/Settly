import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "card";
}

/**
 * Base atomic Skeleton with Settly Navy & Brass shimmer animation.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "bg-[rgba(30,42,74,0.06)] animate-shimmer relative overflow-hidden";

  const variantStyles = {
    default: "rounded-md",
    circular: "rounded-full",
    card: "rounded-xl",
  };

  return (
    <div
      className={twMerge(clsx(baseStyles, variantStyles[variant], className))}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={twMerge(
      "bg-white border border-[rgba(30,42,74,0.10)] rounded-xl overflow-hidden shadow-sm flex flex-col p-4 gap-4",
      className
    )}
  >
    <Skeleton className="w-full h-48 rounded-lg" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-1/2 h-4" />
    </div>
    <div className="pt-3 border-t border-[rgba(30,42,74,0.06)] flex items-center justify-between">
      <Skeleton className="w-24 h-5" />
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full bg-white border border-[rgba(30,42,74,0.10)] rounded-xl overflow-hidden">
    <div className="p-4 bg-[#F7F6F3]/60 border-b border-[rgba(30,42,74,0.06)] flex gap-4">
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
      <Skeleton className="w-1/4 h-4" />
    </div>
    <div className="divide-y divide-[rgba(30,42,74,0.06)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 items-center">
          <Skeleton className="w-1/4 h-5" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * PropertyCardSkeleton — Replicates the exact geometry and visual hierarchy
 * of a Settly property card in catalog streams and search results.
 */
export const PropertyCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={twMerge(
      "bg-white border border-[rgba(30,42,74,0.10)] rounded-2xl overflow-hidden shadow-sm flex flex-col",
      className
    )}
    aria-busy="true"
    aria-label="Loading property"
  >
    {/* Media Thumbnail Container */}
    <div className="relative aspect-[16/10] w-full bg-[#F7F6F3] overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute top-3 left-3 flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="absolute bottom-3 right-3">
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
    </div>

    {/* Body Details */}
    <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
      {/* Location Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-4/5" />

      {/* Price Block */}
      <div className="flex items-baseline justify-between pt-1">
        <Skeleton className="h-7 w-36 font-mono" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>

      {/* Finance Schedule Line */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-2" />
        <Skeleton className="h-3.5 w-28" />
      </div>

      {/* 4-Specs Matrix Row */}
      <div className="grid grid-cols-4 gap-2 pt-3 mt-auto border-t border-[rgba(30,42,74,0.06)]">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * PropertyDetailSkeleton — Full-viewport structural skeleton for property detail pages.
 * Faithfully mirrors breadcrumbs, photo gallery grid, header matrix, and sticky action console.
 */
export const PropertyDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-[#F7F6F3] pb-24" aria-busy="true" aria-label="Loading property details">
    {/* Breadcrumbs Bar */}
    <div className="border-b border-[rgba(30,42,74,0.08)] bg-white/70 py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <span className="text-ink-3">/</span>
          <Skeleton className="h-4 w-20" />
          <span className="text-ink-3">/</span>
          <Skeleton className="h-4 w-28" />
          <span className="text-ink-3">/</span>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Photo Gallery Grid */}
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5 h-[320px] sm:h-[420px] lg:h-[480px]">
          {/* Main Hero Photo */}
          <div className="lg:col-span-3 h-full rounded-2xl overflow-hidden">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
          {/* Side Thumbnails */}
          <div className="hidden lg:grid grid-rows-4 gap-3.5 h-full">
            <Skeleton className="w-full h-full rounded-xl" />
            <Skeleton className="w-full h-full rounded-xl" />
            <Skeleton className="w-full h-full rounded-xl" />
            <Skeleton className="w-full h-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>

    {/* Detail Workspace */}
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-6 sm:p-8 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <Skeleton className="h-9 w-3/4" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* 4-Metric Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-4 text-center space-y-1.5"
              >
                <Skeleton className="h-7 w-20 mx-auto font-mono" />
                <Skeleton className="h-3.5 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* Description Section */}
          <div className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-6 sm:p-8 space-y-4">
            <Skeleton className="h-6 w-36" />
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Map Section */}
          <div className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-6 sm:p-8 space-y-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="w-full h-64 rounded-xl" />
          </div>
        </div>

        {/* Right Sticky Action Console */}
        <div className="rounded-2xl border border-[rgba(30,42,74,0.12)] bg-white p-6 space-y-5 shadow-sm sticky top-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-44 font-mono" />
          </div>

          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Advisor Block */}
          <div className="pt-4 border-t border-[rgba(30,42,74,0.08)] flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * MessagingSidebarSkeleton — Conversation list loading skeleton for Settly messaging.
 */
export const MessagingSidebarSkeleton: React.FC = () => (
  <div className="space-y-1 p-2" aria-busy="true" aria-label="Loading conversations">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-xl border border-transparent"
      >
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * MessageThreadSkeleton — Chat bubble stream loading skeleton with alternating
 * inbound and outbound bubbles and Navy & Brass cues.
 */
export const MessageThreadSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col h-full bg-white" aria-busy="true" aria-label="Loading message thread">
    {/* Thread Header Bar */}
    <div className="px-6 py-4 border-b border-[rgba(30,42,74,0.08)] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-28 rounded-md" />
    </div>

    {/* Messages Stream */}
    <div className="flex-1 p-6 space-y-5 overflow-hidden">
      {/* Inbound message */}
      <div className="flex items-end gap-2.5 max-w-[75%]">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="rounded-2xl rounded-bl-sm border border-[rgba(30,42,74,0.08)] bg-[#F7F6F3] p-4 space-y-1.5 w-64">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-2.5 w-12 pt-1" />
        </div>
      </div>

      {/* Outbound message */}
      <div className="flex items-end justify-end gap-2.5 ml-auto max-w-[75%]">
        <div className="rounded-2xl rounded-br-sm border border-[#C69749]/20 bg-[#C69749]/5 p-4 space-y-1.5 w-72">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-2.5 w-12 ml-auto pt-1" />
        </div>
      </div>

      {/* Inbound message */}
      <div className="flex items-end gap-2.5 max-w-[75%]">
        <Skeleton className="h-7 w-7 rounded-full shrink-0" />
        <div className="rounded-2xl rounded-bl-sm border border-[rgba(30,42,74,0.08)] bg-[#F7F6F3] p-4 space-y-1.5 w-56">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-2.5 w-12 pt-1" />
        </div>
      </div>
    </div>

    {/* Input Dock Bar */}
    <div className="p-4 border-t border-[rgba(30,42,74,0.08)] flex items-center gap-3">
      <Skeleton className="h-10 flex-1 rounded-xl" />
      <Skeleton className="h-10 w-24 rounded-xl" />
    </div>
  </div>
);

/**
 * MessagingTerminalSkeleton — Complete split terminal skeleton for buyer and agent messaging portals.
 */
export const MessagingTerminalSkeleton: React.FC = () => (
  <div className="mx-auto max-w-6xl w-full h-[640px] rounded-2xl border border-[rgba(30,42,74,0.12)] bg-white overflow-hidden shadow-sm flex">
    {/* Left Conversations Sidebar */}
    <div className="w-80 sm:w-96 border-r border-[rgba(30,42,74,0.08)] flex flex-col bg-[#F7F6F3]/40">
      <div className="p-4 border-b border-[rgba(30,42,74,0.08)]">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
      <div className="flex-1 overflow-hidden">
        <MessagingSidebarSkeleton />
      </div>
    </div>

    {/* Right Message Thread */}
    <div className="hidden md:flex flex-1 flex-col">
      <MessageThreadSkeleton />
    </div>
  </div>
);

/**
 * ComparisonMatrixSkeleton — Skeletons for the multi-property comparison matrix.
 */
export const ComparisonMatrixSkeleton: React.FC = () => (
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6" aria-busy="true" aria-label="Loading comparison matrix">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-64 font-display" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>

    <div className="rounded-2xl border border-[rgba(30,42,74,0.12)] bg-white overflow-hidden shadow-sm">
      {/* Header Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(30,42,74,0.08)] border-b border-[rgba(30,42,74,0.08)]">
        <div className="p-6 bg-[#F7F6F3]/50 flex flex-col justify-end">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
        {[1, 2, 3].map((col) => (
          <div key={col} className="p-5 space-y-3">
            <Skeleton className="w-full h-32 rounded-xl" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-6 w-32 font-mono" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ))}
      </div>

      {/* Metric Spec Rows */}
      <div className="divide-y divide-[rgba(30,42,74,0.06)]">
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[rgba(30,42,74,0.08)] p-3.5">
            <div className="px-3 py-1 flex items-center">
              <Skeleton className="h-4 w-28" />
            </div>
            {[1, 2, 3].map((c) => (
              <div key={c} className="px-4 py-1 flex items-center">
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

/**
 * AdminSaleCardSkeleton — Skeleton for Admin Sales desk dossiers and rows.
 */
export const AdminSaleCardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
    aria-busy="true"
    aria-label="Loading sale record"
  >
    <div className="flex items-start gap-4 flex-1">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Skeleton className="h-4 w-32 font-mono" />
          <Skeleton className="h-4 w-24 font-mono" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-6 pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[rgba(30,42,74,0.06)]">
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  </div>
);

/**
 * NotificationItemSkeleton — Single notification item row skeleton.
 */
export const NotificationItemSkeleton: React.FC = () => (
  <div className="flex items-start gap-3.5 p-4 rounded-xl border border-[rgba(30,42,74,0.08)] bg-white">
    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="h-3.5 w-4/5" />
    </div>
  </div>
);

/**
 * NotificationFeedSkeleton — Complete notification timeline feed skeleton.
 */
export const NotificationFeedSkeleton: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
    <NotificationItemSkeleton />
    <NotificationItemSkeleton />
    <NotificationItemSkeleton />
    <NotificationItemSkeleton />
  </div>
);

/**
 * DepositCheckoutSkeleton — Checkout view skeleton for earnest money reservation deposit.
 */
export const DepositCheckoutSkeleton: React.FC = () => (
  <div className="mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-8" aria-busy="true" aria-label="Loading deposit checkout">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-72 font-display" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left 2 Cols: Financial breakdown & summary */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-4">
            <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-36 font-mono" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-3 divide-y divide-[rgba(30,42,74,0.06)]">
            <div className="flex justify-between pt-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28 font-mono" />
            </div>
            <div className="flex justify-between pt-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28 font-mono" />
            </div>
            <div className="flex justify-between pt-3 font-bold">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-32 font-mono" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Col: Paymob payment card */}
      <div className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-4 shadow-sm">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl pt-2" />
      </div>
    </div>
  </div>
);

/**
 * MapSkeleton — GIS Satellite / Radar Leaflet map skeleton with coordinate telemetry.
 */
export const MapSkeleton: React.FC<{ className?: string; message?: string }> = ({
  className,
  message = "Calibrating Spatial GIS Radar...",
}) => (
  <div
    className={twMerge(
      "w-full h-full min-h-[300px] rounded-2xl border border-[rgba(30,42,74,0.12)] bg-[#F7F6F3] relative overflow-hidden flex items-center justify-center p-6",
      className
    )}
    aria-busy="true"
    aria-label="Loading map coordinates"
  >
    {/* Animated Shimmer Underlay */}
    <div className="absolute inset-0 bg-[rgba(30,42,74,0.04)] animate-shimmer" />

    {/* Subtle Radar Concentric Circles / Crosshairs */}
    <div className="relative z-10 text-center space-y-3 max-w-sm">
      <div className="mx-auto w-12 h-12 rounded-full border border-[#C69749]/40 bg-white/60 flex items-center justify-center shadow-sm">
        <div className="w-5 h-5 rounded-full border border-dashed border-[#C69749] animate-spin" />
      </div>
      <div>
        <p className="font-serif text-base text-[#131D36] font-medium">{message}</p>
        <p className="text-xs text-[#64748B] font-mono mt-1">Calibrating prime Egyptian micro-market coordinates</p>
      </div>
    </div>
  </div>
);

/**
 * AvailabilityEditorSkeleton — Skeleton for agent availability schedules.
 */
export const AvailabilityEditorSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-4" aria-busy="true" aria-label="Loading availability">
    <div className="flex justify-between items-center pb-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((d) => (
        <div key={d} className="flex items-center justify-between p-3 rounded-xl border border-[rgba(30,42,74,0.06)] bg-[#F7F6F3]/40">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);
