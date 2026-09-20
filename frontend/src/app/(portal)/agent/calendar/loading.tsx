import { ListSkeleton } from "@/components/viewings/ViewingParts";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AgentCalendarLoading() {
  return (
    <div className="portal-content space-y-6" aria-busy="true" aria-label="Loading viewing schedule">
      <div className="space-y-2">
        <Skeleton className="h-8 w-60 font-display" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex gap-2 border-b border-line pb-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      <ListSkeleton rows={4} />
    </div>
  );
}
