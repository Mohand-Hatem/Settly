import { OfferListSkeleton } from "@/components/offers/OfferParts";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BuyerOffersLoading() {
  return (
    <div className="portal-content space-y-6" aria-busy="true" aria-label="Loading offers">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 font-display" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex gap-2 border-b border-line pb-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <OfferListSkeleton />
    </div>
  );
}
