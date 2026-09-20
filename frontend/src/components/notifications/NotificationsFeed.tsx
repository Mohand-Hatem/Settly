"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Check,
  Search,
  HandCoins,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  notificationsListQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/lib/query/notifications";
import type { NotificationCategory, NotificationDto } from "@/api/notifications";
import { NotificationFeedSkeleton } from "@/components/ui/Skeleton";

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isYesterday(date: Date): boolean {
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  return (
    date.getDate() === yest.getDate() &&
    date.getMonth() === yest.getMonth() &&
    date.getFullYear() === yest.getFullYear()
  );
}

function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString);
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday(date)) return `Today · ${time}`;
  if (isYesterday(date)) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${time}`;
}

function CategoryBadge({ category }: { category: NotificationCategory }) {
  switch (category) {
    case "DEALS":
      return (
        <span className="inline-flex items-center rounded-full bg-brass/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-brass-600">
          Deals &amp; Deposits
        </span>
      );
    case "VIEWINGS":
      return (
        <span className="inline-flex items-center rounded-full bg-navy-800/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-navy-800">
          Viewing Tour
        </span>
      );
    case "MESSAGES":
      return (
        <span className="inline-flex items-center rounded-full bg-navy-600/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-navy-600">
          Inquiry Chat
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-sage/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sage">
          System Notice
        </span>
      );
  }
}

function CategoryIconDisc({ category }: { category: NotificationCategory }) {
  switch (category) {
    case "DEALS":
      return (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-brass/30 bg-brass/10 text-brass-600">
          <HandCoins className="h-5 w-5" aria-hidden />
        </div>
      );
    case "VIEWINGS":
      return (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-navy-800/20 bg-navy-800/10 text-navy-800">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </div>
      );
    case "MESSAGES":
      return (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-navy-600/20 bg-navy-600/10 text-navy-600">
          <MessageSquare className="h-5 w-5" aria-hidden />
        </div>
      );
    default:
      return (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-sage/30 bg-sage/10 text-sage">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
      );
  }
}

export function NotificationsFeed({ portal }: { portal: "buyer" | "agent" | "admin" }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<"all" | NotificationCategory>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery(notificationsListQuery(false));

  const markReadMut = useMarkNotificationReadMutation();
  const markAllMut = useMarkAllNotificationsReadMutation();
  const deleteMut = useDeleteNotificationMutation();

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (unreadOnly && item.isRead) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesBody = item.body.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBody) return false;
      }
      return true;
    });
  }, [allItems, unreadOnly, selectedCategory, searchQuery]);

  // Group items by timeline: Today, Yesterday, Earlier
  const timelineGroups = useMemo(() => {
    const today: NotificationDto[] = [];
    const yesterday: NotificationDto[] = [];
    const earlier: NotificationDto[] = [];

    for (const item of filteredItems) {
      const d = new Date(item.createdAt);
      if (isToday(d)) {
        today.push(item);
      } else if (isYesterday(d)) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    }

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filteredItems]);

  const handleAction = async (item: NotificationDto) => {
    if (!item.isRead) {
      await markReadMut.mutateAsync(item.id);
    }
    router.push(item.actionUrl);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Command Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
            Notifications &amp; Alerts
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Real-time updates on viewings, offer negotiations, reservation deposits, and account activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-navy-900 shadow-sm transition hover:border-line-2 hover:bg-canvas disabled:opacity-50"
            onClick={() => markAllMut.mutate()}
            disabled={unreadCount === 0 || markAllMut.isPending}
          >
            <CheckCheck className="h-4 w-4 text-brass" />
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Unread Alerts</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass-050 text-brass-600">
              <Bell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900">{unreadCount}</span>
            <span className="text-xs text-ink-3">action required</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Offers &amp; Deposits</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass/10 text-brass-600">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900">
              {allItems.filter((i) => i.category === "DEALS").length}
            </span>
            <span className="text-xs text-ink-3">deal updates</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Viewing Tours</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-800/10 text-navy-800">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900">
              {allItems.filter((i) => i.category === "VIEWINGS").length}
            </span>
            <span className="text-xs text-ink-3">appointments</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">Total Alerts</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sage/10 text-sage">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900">{allItems.length}</span>
            <span className="text-xs text-ink-3">persisted</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "all"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas text-ink-2 hover:bg-canvas-2"
            }`}
          >
            All Alerts ({allItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("DEALS")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "DEALS"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas text-ink-2 hover:bg-canvas-2"
            }`}
          >
            Offers &amp; Deposits
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("VIEWINGS")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "VIEWINGS"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas text-ink-2 hover:bg-canvas-2"
            }`}
          >
            Viewings
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("MESSAGES")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              selectedCategory === "MESSAGES"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas text-ink-2 hover:bg-canvas-2"
            }`}
          >
            Messages
          </button>
        </div>

        {/* Unread Toggle & Search */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-ink-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line text-brass focus:ring-brass"
            />
            <span>Unread only</span>
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              placeholder="Filter alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-line bg-canvas/50 pl-8 pr-3 py-1.5 text-xs text-navy-900 placeholder:text-ink-3 focus:border-brass focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notifications Feed by Timeline */}
      {isLoading ? (
        <NotificationFeedSkeleton />
      ) : timelineGroups.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-canvas">
            <Bell className="h-8 w-8 text-ink-3" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-navy-900">
            {unreadOnly ? "No unread alerts" : "You're all caught up"}
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            {unreadOnly
              ? "All your notifications have been marked as read."
              : "When new viewings, offers, or messages arrive, they'll appear here."}
          </p>
          {unreadOnly && (
            <button
              type="button"
              onClick={() => setUnreadOnly(false)}
              className="mt-4 rounded-xl border border-line bg-canvas px-4 py-2 text-xs font-semibold text-navy-900 hover:bg-canvas-2"
            >
              Show all {portal} notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {timelineGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              {/* Timeline Header */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-3">
                  {group.title}
                </span>
                <div className="h-px flex-1 bg-line" />
                <span className="font-mono text-[10px] text-ink-3">
                  {group.items.length} {group.items.length === 1 ? "alert" : "alerts"}
                </span>
              </div>

              {/* Stack of cards */}
              <div className="space-y-3">
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className={`group relative rounded-2xl border bg-white p-5 shadow-sm transition hover:border-brass-200 hover:shadow-md ${
                      !item.isRead
                        ? "border-l-4 border-l-brass border-line bg-gradient-to-r from-brass-050/30 via-white to-white"
                        : "border-line"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon Disc */}
                      <CategoryIconDisc category={item.category} />

                      {/* Content Column */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={item.category} />
                          <span className="font-mono text-xs text-ink-3">
                            {formatNotificationTime(item.createdAt)}
                          </span>
                          {!item.isRead && (
                            <span className="flex h-2 w-2 rounded-full bg-brass animate-pulse" />
                          )}
                        </div>

                        <h2 className="mt-2 text-base font-bold text-navy-900 leading-snug">
                          {item.title}
                        </h2>

                        <p className="mt-1 text-sm text-ink-2 leading-relaxed">
                          {item.body}
                        </p>

                        {/* Actions Strip */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAction(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-800"
                          >
                            <span>Open Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={() => markReadMut.mutate(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas/40 px-2.5 py-1.5 text-xs font-semibold text-ink-2 transition hover:bg-canvas hover:text-navy-900"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Mark read</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteMut.mutate(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-ink-3 transition hover:text-red-600 hover:bg-red-50 ml-auto"
                            title="Dismiss notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
