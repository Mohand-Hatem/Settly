"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  HandCoins,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  unreadNotificationCountQuery,
  notificationsListQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/lib/query/notifications";
import type { NotificationDto } from "@/api/notifications";
import { Skeleton } from "@/components/ui/Skeleton";

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "DEALS":
      return <HandCoins className="h-4 w-4 text-brass-600" aria-hidden />;
    case "VIEWINGS":
      return <CalendarDays className="h-4 w-4 text-navy-800" aria-hidden />;
    case "MESSAGES":
      return <MessageSquare className="h-4 w-4 text-navy-800" aria-hidden />;
    default:
      return <ShieldCheck className="h-4 w-4 text-sage" aria-hidden />;
  }
}

export function NotificationBell({ portal }: { portal: "buyer" | "agent" | "admin" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: countData } = useQuery(unreadNotificationCountQuery());
  const { data: listData, isLoading } = useQuery({
    ...notificationsListQuery(false),
    enabled: open,
  });

  const markReadMut = useMarkNotificationReadMutation();
  const markAllMut = useMarkAllNotificationsReadMutation();

  const unreadCount = countData?.unreadCount ?? 0;
  const items = listData?.items?.slice(0, 5) ?? [];

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleItemClick = async (item: NotificationDto) => {
    if (!item.isRead) {
      await markReadMut.mutateAsync(item.id);
    }
    setOpen(false);
    router.push(item.actionUrl);
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllMut.mutateAsync();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
          open
            ? "border-brass bg-brass-050 text-navy-950"
            : "border-line bg-white text-navy-900 hover:border-line-2 hover:bg-canvas"
        }`}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brass px-1 font-mono text-[10px] font-bold text-navy-950 shadow-sm animate-in fade-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-canvas/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-navy-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brass/20 px-2 py-0.5 font-mono text-xs font-bold text-brass-600">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-navy-900 transition"
                onClick={handleMarkAll}
                disabled={markAllMut.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-line/60">
            {isLoading ? (
              <div className="p-3 space-y-2.5" aria-busy="true" aria-label="Loading alerts">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-xl">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-3">
                <Bell className="h-8 w-8 text-line-2 mx-auto mb-2" />
                You&apos;re all caught up! No notifications.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-canvas/60 ${
                    !item.isRead ? "bg-brass-050/40" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border ${
                      item.category === "DEALS"
                        ? "border-brass/30 bg-brass/10"
                        : item.category === "VIEWINGS"
                        ? "border-navy-600/30 bg-navy-600/10"
                        : item.category === "MESSAGES"
                        ? "border-navy-600/30 bg-navy-600/10"
                        : "border-sage/30 bg-sage/10"
                    }`}
                  >
                    <CategoryIcon category={item.category} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-navy-900">
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brass" />
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-ink-2 mt-0.5">
                      {item.body}
                    </p>
                    <span className="font-mono text-[10px] text-ink-3 mt-1 block">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="border-t border-line bg-canvas/30 p-2.5 text-center">
            <Link
              href={`/${portal}/notifications`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-brass-600 transition"
            >
              <span>View all notifications</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
