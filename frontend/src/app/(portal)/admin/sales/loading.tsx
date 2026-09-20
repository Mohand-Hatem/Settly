import { AdminSaleCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AdminSalesLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6" aria-busy="true" aria-label="Loading admin sales desk">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 font-display" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <AdminSaleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
