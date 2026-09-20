import { Skeleton } from "@/components/ui/Skeleton";

export default function MarketInsightsLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-24 space-y-10" aria-busy="true" aria-label="Loading market insights">
      {/* Header */}
      <div className="border-b border-[rgba(30,42,74,0.08)] bg-white/70 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-8 w-80 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Econometric Chart Skeleton */}
        <div className="rounded-2xl border border-[rgba(30,42,74,0.12)] bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-48 font-display" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-14 rounded-lg" />
              <Skeleton className="h-8 w-14 rounded-lg" />
              <Skeleton className="h-8 w-14 rounded-lg" />
              <Skeleton className="h-8 w-14 rounded-lg" />
            </div>
          </div>
          <Skeleton className="w-full h-80 rounded-xl" />
        </div>

        {/* Macro Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-28 font-mono" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
