import { MapSkeleton, PropertyCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AreaDetailLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-24 space-y-10" aria-busy="true" aria-label="Loading area dossier">
      {/* Hero Cover Banner Skeleton */}
      <div className="relative h-[320px] sm:h-[400px] w-full bg-[#131D36] flex items-end">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-80 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Telemetry Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-5 text-center space-y-2">
              <Skeleton className="h-7 w-24 mx-auto font-mono" />
              <Skeleton className="h-3.5 w-20 mx-auto" />
            </div>
          ))}
        </div>

        {/* GIS Perimeter Map */}
        <MapSkeleton className="h-[460px]" message="Calibrating Masterplan GIS Perimeter..." />

        {/* Featured Residences */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-56 font-display" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
