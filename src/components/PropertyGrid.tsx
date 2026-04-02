import type { Listing } from "@/types";
import PropertyCard from "./PropertyCard";

interface PropertyGridProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  compact?: boolean;
}

export default function PropertyGrid({
  listings,
  onListingClick,
  compact = false,
}: PropertyGridProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">No stays match this filter set</h3>
        <p className="mt-2 text-sm text-slate-500">
          Reset a few filters or widen the location to bring more options back into view.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6"
          : "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      }
    >
      {listings.map((listing) => (
        <PropertyCard
          key={listing.id}
          listing={listing}
          onClick={onListingClick}
        />
      ))}
    </div>
  );
}
