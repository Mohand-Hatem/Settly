import { PropertyCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AgentProfileLoading() {
  return (
    <div className="min-h-screen bg-canvas pb-24 space-y-10" aria-busy="true" aria-label="Loading advisor profile">
      {/* Advisor Header Card */}
      <div className="border-b border-[rgba(30,42,74,0.08)] bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-24 h-24 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56 font-display" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgba(30,42,74,0.08)] bg-white p-5 text-center space-y-2">
              <Skeleton className="h-7 w-20 mx-auto font-mono" />
              <Skeleton className="h-3.5 w-24 mx-auto" />
            </div>
          ))}
        </div>

        {/* Portfolio Stream */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-48 font-display" />
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
