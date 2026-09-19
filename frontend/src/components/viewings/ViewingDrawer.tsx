"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { ApiError, problemMessage } from "@/api/errors";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { useViewingAction, viewingSlotsQuery } from "@/lib/query/pipeline";
import { cairoDay, cairoLongDay, cairoRange } from "@/lib/cairo-format";
import { ViewingStatusBadge } from "./ViewingParts";

const GRACE_MS = 30 * 60_000;
const SHORT_NOTICE_MS = 2 * 60 * 60_000;

type Mode = null | "cancel" | "decline" | "propose";

/**
 * Viewing detail drawer (BUY-05 / AGT-12). Each state-machine transition is its own button
 * (UX_PATTERNS §5); a 409 refetches and explains that the viewing changed.
 */
export function ViewingDrawer({
  viewing,
  view,
  onClose,
}: {
  viewing: Viewing | null;
  view: "buyer" | "agent";
  onClose: () => void;
}) {
  const action = useViewingAction();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [proposed, setProposed] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMode(null);
    setReason("");
    setProposed(null);
    action.reset();
    setNow(Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?.id]);

  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, onClose]);

  const slots = useQuery({ ...viewingSlotsQuery(viewing?.property.id ?? ""), enabled: mode === "propose" && !!viewing });

  const slotOptions = useMemo(() => slots.data?.slots.slice(0, 60) ?? [], [slots.data]);

  if (!viewing) return null;

  const start = new Date(viewing.startsAt).getTime();
  const run = (name: Parameters<typeof action.mutate>[0]["action"], extra: { reason?: string; startsAt?: string } = {}, done?: string) =>
    action.mutate(
      { id: viewing.id, action: name, ...extra },
      {
        onSuccess: () => {
          if (done) toast.success(done);
          onClose();
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) toast.info(problemMessage(err));
        },
      }
    );

  const isBuyer = view === "buyer";
  const shortNotice = viewing.status === "CONFIRMED" && start - now < SHORT_NOTICE_MS && start > now;

  const buyerActions = (
    <>
      {viewing.status === "REQUESTED" && (
        <Button variant="outline" onClick={() => run("cancel", {}, "Request withdrawn")} isLoading={action.isPending}>
          Withdraw request
        </Button>
      )}
      {viewing.status === "RESCHEDULE_PROPOSED" && (
        <>
          <Button variant="navy" onClick={() => run("accept-reschedule", {}, "Viewing confirmed")} isLoading={action.isPending}>
            Accept new time
          </Button>
          <Button variant="outline" onClick={() => run("decline-reschedule", {}, "Proposal declined")} disabled={action.isPending}>
            Decline
          </Button>
        </>
      )}
      {viewing.status === "CONFIRMED" && (
        <Button variant="outline" onClick={() => setMode("cancel")}>Cancel viewing</Button>
      )}
    </>
  );

  const agentActions = (
    <>
      {viewing.status === "REQUESTED" && (
        <>
          <Button variant="navy" onClick={() => run("confirm", {}, "Viewing confirmed")} isLoading={action.isPending}>
            Confirm
          </Button>
          <Button variant="outline" onClick={() => setMode("propose")}>Propose another time</Button>
          <Button variant="ghost" onClick={() => setMode("decline")}>Decline</Button>
        </>
      )}
      {viewing.status === "CONFIRMED" && (
        <>
          <Button
            variant="navy"
            onClick={() => run("complete", {}, "Marked as completed")}
            disabled={now < start || action.isPending}
            title={now < start ? "Available once the viewing starts" : undefined}
          >
            Mark completed
          </Button>
          <Button
            variant="outline"
            onClick={() => run("no-show", {}, "No-show recorded")}
            disabled={now < start + GRACE_MS || action.isPending}
            title={now < start + GRACE_MS ? "Available 30 minutes after the start time" : undefined}
          >
            Buyer didn&apos;t show
          </Button>
          <Button variant="ghost" onClick={() => setMode("cancel")}>Cancel viewing</Button>
        </>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="viewing-drawer-title">
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h2 id="viewing-drawer-title" className="font-display text-xl text-navy-900">
              {viewing.property.title ?? "Viewing"}
            </h2>
            <div className="mt-1"><ViewingStatusBadge status={viewing.status} /></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-3 hover:bg-canvas" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="grid gap-3 p-5 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">When (Cairo time)</dt>
            <dd className="text-ink">{cairoLongDay(viewing.startsAt)} · {cairoRange(viewing.startsAt, viewing.endsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">{isBuyer ? "Agent" : "Buyer"}</dt>
            <dd className="text-ink">{isBuyer ? viewing.agent.name : viewing.buyer?.name ?? "—"}</dd>
          </div>
          {viewing.note && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">Buyer&apos;s note</dt>
              <dd className="whitespace-pre-line text-ink-2">{viewing.note}</dd>
            </div>
          )}
          {viewing.cancellationReason && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink-3">Reason</dt>
              <dd className="text-ink-2">{viewing.cancellationReason}</dd>
            </div>
          )}
          {viewing.status === "RESCHEDULE_PROPOSED" && (
            <p className="rounded-lg bg-brass-50 p-3 text-ink">The agent proposed the time above instead of your original request.</p>
          )}
          <Link href={`/properties/${viewing.property.slug}`} className="text-sm font-semibold text-navy-900 underline underline-offset-2">
            View the listing
          </Link>
        </dl>

        {mode === null && (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-line p-5">
            {isBuyer ? buyerActions : agentActions}
          </div>
        )}

        {(mode === "cancel" || mode === "decline") && (
          <form
            className="mt-auto flex flex-col gap-3 border-t border-line p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "cancel") run("cancel", { reason: reason.trim() }, "Viewing cancelled");
              else run("decline", { reason: reason.trim() || undefined }, "Request declined");
            }}
          >
            {shortNotice && mode === "cancel" && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                This viewing starts in less than 2 hours. Late cancellations are recorded.
              </p>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">
                {mode === "cancel" ? "Reason (required)" : "Reason (optional)"}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                required={mode === "cancel"}
                minLength={mode === "cancel" ? 3 : undefined}
                className="rounded-lg border border-line p-2 text-sm focus:border-navy-700 focus:outline-none"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setMode(null)}>Back</Button>
              <Button type="submit" variant="danger" isLoading={action.isPending} disabled={mode === "cancel" && reason.trim().length < 3}>
                {mode === "cancel" ? "Cancel viewing" : "Decline request"}
              </Button>
            </div>
          </form>
        )}

        {mode === "propose" && (
          <div className="mt-auto flex flex-col gap-3 border-t border-line p-5">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">New time (from your availability)</span>
              <select
                value={proposed ?? ""}
                onChange={(e) => setProposed(e.target.value || null)}
                className="rounded-lg border border-line p-2 text-sm"
                disabled={slots.isPending}
              >
                <option value="">{slots.isPending ? "Loading…" : slotOptions.length ? "Choose a time" : "No free times in the next 30 days"}</option>
                {slotOptions.map((s) => (
                  <option key={s.startsAt} value={s.startsAt}>
                    {cairoDay(s.startsAt)} · {cairoRange(s.startsAt, s.endsAt)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)}>Back</Button>
              <Button variant="navy" disabled={!proposed} isLoading={action.isPending} onClick={() => run("propose-reschedule", { startsAt: proposed! }, "New time proposed")}>
                Propose time
              </Button>
            </div>
          </div>
        )}

        {action.isError && !(action.error instanceof ApiError && action.error.status === 409) && (
          <p role="alert" className="mx-5 mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{problemMessage(action.error)}</p>
        )}
      </div>
    </div>
  );
}
