import { useState } from "react";
import { Heart, MapPin, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { rawButtonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";
import { useToast } from "./ui/use-toast";

interface PropertyCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
  showBorder?: boolean;
  compact?: boolean;
}

export default function PropertyCard({
  listing,
  onClick,
  showBorder = false,
  compact = false,
}: PropertyCardProps) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const highlightAmenities = listing.amenities.slice(0, compact ? 1 : 2);

  const toggleWishlist = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSaved((current) => !current);
    toast({ title: saved ? "Removed from wishlist" : "Added to wishlist" });
  };

  return (
    <article
      className={cn(
        "group cursor-pointer overflow-hidden rounded-[1.75rem] transition-transform duration-300 hover:-translate-y-1",
        showBorder
          ? "border border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          : "bg-transparent",
      )}
      onClick={() => onClick(listing)}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-slate-100",
          compact ? "aspect-[5/4]" : "aspect-[16/10] sm:aspect-[4/5]",
        )}
      >
        <img
          src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/900/700`}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <Badge className="rounded-full border-none bg-white/90 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-900 shadow-none">
            <Star className="mr-1 h-3 w-3 fill-current" />
            {listing.rating.toFixed(1)}
          </Badge>
          {listing.discount > 0 ? (
            <Badge className="rounded-full border-none bg-emerald-500 px-2.5 py-1 text-[0.68rem] font-semibold text-white shadow-none">
              Save {listing.discount}%
            </Badge>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          onClick={toggleWishlist}
          className={cn(
            rawButtonVariants({ variant: "neutral", size: "icon-sm" }),
            "absolute right-3 top-3 bg-white/88 shadow-[0_8px_20px_rgba(15,23,42,0.18)] backdrop-blur hover:bg-white"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              saved ? "fill-rose-500 text-rose-500" : "text-slate-700",
            )}
          />
        </button>

        <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/72 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
          R{listing.pricePerNight.toLocaleString()}
          <span className="ml-1 text-xs font-medium text-white/70">night</span>
        </div>
      </div>

      <div className={cn("space-y-3 p-4", compact ? "p-3.5" : "p-4 sm:p-5")}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            {listing.location}
            {listing.province ? <span className="text-slate-300">/ {listing.province}</span> : null}
          </div>
          <h3 className={cn("font-semibold tracking-tight text-slate-900", compact ? "text-base" : "text-xl")}>
            {listing.title}
          </h3>
          {!compact ? (
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">
              {listing.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <Users className="h-3.5 w-3.5" />
            {listing.adults + listing.children} guests
          </div>
          {highlightAmenities.map((amenity) => (
            <div key={amenity} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {amenity}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
