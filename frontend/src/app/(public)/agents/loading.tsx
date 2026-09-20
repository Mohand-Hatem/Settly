import { Skeleton } from "@/components/ui/Skeleton";

export default function AgentsLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-20 space-y-8" aria-busy="true" aria-label="Loading licensed advisors">
      {/* Header */}
      <div className="border-b border-[rgba(30,42,74,0.08)] bg-white/70 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-8 w-64 font-display" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgba(30,42,74,0.10)] bg-white p-6 space-y-5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 py-3 border-y border-[rgba(30,42,74,0.06)] text-center">
                <div>
                  <Skeleton className="h-4 w-10 mx-auto" />
                  <Skeleton className="h-2.5 w-12 mx-auto mt-1" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mx-auto font-mono" />
                  <Skeleton className="h-2.5 w-12 mx-auto mt-1" />
                </div>
                <div>
                  <Skeleton className="h-4 w-10 mx-auto" />
                  <Skeleton className="h-2.5 w-12 mx-auto mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
