import { MapSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AreasLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-20 space-y-8" aria-busy="true" aria-label="Loading micro-markets">
      <div className="border-b border-[rgba(30,42,74,0.08)] bg-white/70 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-8 w-64 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <MapSkeleton className="h-[420px]" message="Calibrating Prime Egyptian Micro-Markets..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-5 space-y-4">
              <Skeleton className="w-full h-44 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between pt-2 border-t border-[rgba(30,42,74,0.06)]">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24 font-mono" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
