"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { UpdateAvailability } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { availabilityQuery, useSaveAvailability } from "@/lib/query/pipeline";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

type Window = UpdateAvailability["windows"][number];

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/**
 * Weekly availability in Cairo wall-clock plus blackout dates (spec S1-13). Windows are split into
 * 60-minute slots (#106); a window shorter than 60 minutes is rejected.
 */
export function AvailabilityEditor() {
  const query = useQuery(availabilityQuery());
  const save = useSaveAvailability();
  const [windows, setWindows] = useState<Window[]>([]);
  const [blackouts, setBlackouts] = useState<string[]>([]);
  const [newBlackout, setNewBlackout] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (query.data && !dirty) {
      setWindows(query.data.windows);
      setBlackouts(query.data.blackouts);
    }
  }, [query.data, dirty]);

  const update = (next: Window[]) => {
    setWindows(next);
    setDirty(true);
  };
  const invalid = windows.findIndex((w) => minutes(w.endTime) - minutes(w.startTime) < 60);

  if (query.isPending) return <div className="h-40 animate-pulse rounded-xl bg-canvas-2" />;
  if (query.isError) return <p role="alert" className="text-sm text-red-700">{problemMessage(query.error)}</p>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-2">
        Buyers can request 60-minute viewings inside these hours (Cairo time), up to 30 days ahead. Without
        availability, buyers cannot request viewings on your listings.
      </p>

      <div className="space-y-2">
        {windows.length === 0 && <p className="rounded-lg bg-canvas p-3 text-sm text-ink-2">No hours set yet.</p>}
        {windows.map((w, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white p-2">
            <select aria-label="Day" value={w.dayOfWeek} onChange={(e) => update(windows.map((x, j) => (j === i ? { ...x, dayOfWeek: Number(e.target.value) } : x)))} className="rounded-md border border-line p-1.5 text-sm">
              {DAYS.map((d, n) => <option key={d} value={n}>{d}</option>)}
            </select>
            <select aria-label="From" value={w.startTime} onChange={(e) => update(windows.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))} className="rounded-md border border-line p-1.5 text-sm">
              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-sm text-ink-3">to</span>
            <select aria-label="To" value={w.endTime} onChange={(e) => update(windows.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)))} className="rounded-md border border-line p-1.5 text-sm">
              {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={() => update(windows.filter((_, j) => j !== i))} className="ml-auto rounded-md p-1.5 text-ink-3 hover:bg-canvas hover:text-red-700" aria-label="Remove hours">
              <Trash2 className="h-4 w-4" />
            </button>
            {minutes(w.endTime) - minutes(w.startTime) < 60 && (
              <span className="w-full text-xs text-red-700">Each window must be at least 60 minutes.</span>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => update([...windows, { dayOfWeek: 0, startTime: "10:00", endTime: "14:00" }])}>
          Add hours
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-ink">Days off</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {blackouts.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs">
              {d}
              <button type="button" aria-label={`Remove ${d}`} onClick={() => { setBlackouts(blackouts.filter((x) => x !== d)); setDirty(true); }}>
                <Trash2 className="h-3 w-3 text-ink-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input type="date" value={newBlackout} onChange={(e) => setNewBlackout(e.target.value)} className="rounded-md border border-line p-1.5 text-sm" aria-label="Day off" />
          <Button variant="outline" size="sm" disabled={!newBlackout} onClick={() => { if (!blackouts.includes(newBlackout)) setBlackouts([...blackouts, newBlackout].sort()); setNewBlackout(""); setDirty(true); }}>
            Add day off
          </Button>
        </div>
      </div>

      {save.isError && <p role="alert" className="text-sm text-red-700">{problemMessage(save.error)}</p>}
      <div className="flex justify-end">
        <Button
          variant="navy"
          disabled={!dirty || invalid >= 0}
          isLoading={save.isPending}
          onClick={() =>
            save.mutate({ windows, blackouts }, {
              onSuccess: () => {
                setDirty(false);
                toast.success("Availability saved");
              },
            })
          }
        >
          Save availability
        </Button>
      </div>
    </div>
  );
}
