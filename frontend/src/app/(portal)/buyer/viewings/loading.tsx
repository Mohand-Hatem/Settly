import { ListSkeleton } from "@/components/viewings/ViewingParts";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BuyerViewingsLoading() {
  return (
    <div className="portal-content space-y-6" aria-busy="true" aria-label="Loading viewings schedule">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 font-display" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="flex gap-2 border-b border-line pb-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <ListSkeleton rows={3} />
    </div>
  );
}
