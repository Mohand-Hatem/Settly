"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { requestViewing } from "@/api/pipeline";
import { ApiError, problemMessage } from "@/api/errors";
import { pipelineKeys, viewingSlotsQuery } from "@/lib/query/pipeline";
import { cairoDateKey, cairoDay, cairoLongDay, cairoRange } from "@/lib/cairo-format";

/**
 * Request a viewing (spec S1-09, V1). 60-minute slots in Cairo time, up to 30 days ahead (#106).
 * The server enforces every rule; this component only explains them.
 */
export function RequestViewingModal({
  propertyId,
  propertyTitle,
  isOpen,
  onClose,
}: {
  propertyId: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const slots = useQuery({ ...viewingSlotsQuery(propertyId), enabled: isOpen });
  const [day, setDay] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [note, setNote] = useState("");
  // One Idempotency-Key per attempt: a double click or retry of the same attempt is a no-op.
  const keyRef = useRef<string>("");

  const mutation = useMutation({
    mutationFn: () => requestViewing({ propertyId, startsAt: startsAt!, note: note.trim() || undefined }, keyRef.current),
    onSuccess: () => qc.invalidateQueries({ queryKey: pipelineKeys.all }),
    onError: (err) => {
      keyRef.current = crypto.randomUUID();
      if (err instanceof ApiError && err.type === "/errors/slot-unavailable") {
        setStartsAt(null);
        void slots.refetch();
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      keyRef.current = crypto.randomUUID();
      setStartsAt(null);
      setNote("");
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const byDay = useMemo(() => {
    const map = new Map<string, { startsAt: string; endsAt: string }[]>();
    for (const s of slots.data?.slots ?? []) {
      const k = cairoDateKey(s.startsAt);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return map;
  }, [slots.data]);
  const days = [...byDay.keys()];
  const activeDay = day && byDay.has(day) ? day : days[0] ?? null;

  const selected = startsAt ? slots.data?.slots.find((s) => s.startsAt === startsAt) : undefined;

  if (mutation.isSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Request sent" maxWidth="md">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <CalendarCheck2 className="h-10 w-10 text-sage" aria-hidden />
          <p className="text-sm text-ink-2">
            The agent will confirm, decline or propose another time. You can follow it under My viewings.
          </p>
          {selected && (
            <p className="text-sm font-semibold text-ink">
              {cairoLongDay(selected.startsAt)} · {cairoRange(selected.startsAt, selected.endsAt)} (Cairo time)
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Link href="/buyer/viewings?tab=pending" className="inline-flex items-center rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">
              My viewings
            </Link>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request a viewing"
      description={`${propertyTitle} · 60-minute visit · times in Cairo time`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-4">
        {slots.isPending ? (
          <div className="space-y-2" aria-label="Loading available times">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : slots.isError ? (
          <p role="alert" className="text-sm text-red-700">{problemMessage(slots.error)}</p>
        ) : days.length === 0 ? (
          <p className="rounded-lg bg-canvas p-4 text-sm text-ink-2">
            The agent has no available times in the next 30 days. Please check back later.
          </p>
        ) : (
          <>
            <div role="tablist" aria-label="Day" className="flex gap-2 overflow-x-auto pb-1">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={d === activeDay}
                  onClick={() => {
                    setDay(d);
                    setStartsAt(null);
                  }}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${
                    d === activeDay ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink-2 hover:border-navy-700"
                  }`}
                >
                  {cairoDay(byDay.get(d)![0]!.startsAt)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Time">
              {(activeDay ? byDay.get(activeDay)! : []).map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  role="radio"
                  aria-checked={s.startsAt === startsAt}
                  onClick={() => setStartsAt(s.startsAt)}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium ${
                    s.startsAt === startsAt ? "border-brass bg-brass-50 text-navy-900" : "border-line bg-white text-ink hover:border-brass"
                  }`}
                >
                  {cairoRange(s.startsAt, s.endsAt)}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-ink">Note to the agent (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                className="rounded-lg border border-line bg-white p-2 text-sm focus:border-navy-700 focus:outline-none"
              />
            </label>
            <p className="text-xs text-ink-3">
              Several buyers can ask for the same time; the agent confirms one. You can have up to 3 open requests.
            </p>
          </>
        )}

        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {problemMessage(mutation.error)}
            {mutation.error instanceof ApiError && mutation.error.type === "/errors/open-viewing-limit" && (
              <> <Link href="/buyer/viewings?tab=pending" className="font-semibold underline">Open My viewings</Link></>
            )}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="navy"
            disabled={!startsAt}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Send request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
