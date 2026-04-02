import { useMemo, useRef, useState } from "react";
import { eachDayOfInterval, format, startOfDay } from "date-fns";
import { ArrowRight, Compass, Map, Rows3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import FilterBar from "@/components/FilterBar";
import FiltersModal, { type ListingFilters } from "@/components/FiltersModal";
import PropertyCard from "@/components/PropertyCard";
import PropertyGrid from "@/components/PropertyGrid";
import PropertyMap from "@/components/PropertyMap";
import SearchFilterBar, { type SearchFilterState } from "@/components/SearchFilterBar";
import { Button, rawButtonVariants } from "@/components/ui/button";
import { CATEGORIES } from "@/constants/categories";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

const DEFAULT_LISTING_FILTERS: ListingFilters = {
  minPrice: "",
  maxPrice: "",
  adults: 0,
  children: 0,
  amenities: [],
  facilities: [],
  province: "all",
  category: "all",
};

function resolveCategoryLabel(activeCategory: string) {
  if (activeCategory === "all") {
    return "All stays";
  }

  const topLevelCategory = CATEGORIES.find((category) => category.id === activeCategory);
  if (topLevelCategory) {
    return topLevelCategory.label;
  }

  for (const category of CATEGORIES) {
    const matchedSubcategory = category.subcategories.find((subCategory) => subCategory.id === activeCategory);
    if (matchedSubcategory) {
      return matchedSubcategory.label;
    }
  }

  return "Curated stays";
}

export default function ExploreView({
  listings,
  onBook,
}: {
  listings: Listing[];
  onBook: (listing: Listing) => void;
}) {
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLElement | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilterState>({ query: "", guests: 1 });
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_LISTING_FILTERS);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice) count += 1;
    if (filters.maxPrice) count += 1;
    if (filters.adults > 0) count += 1;
    if (filters.children > 0) count += 1;
    if (filters.amenities.length > 0) count += 1;
    if (filters.facilities.length > 0) count += 1;
    if (filters.province !== "all") count += 1;
    if (filters.category !== "all") count += 1;
    return count;
  }, [filters]);

  const filteredListings = useMemo(() => {
    const query = searchFilters.query.trim().toLowerCase();
    const selectedFrom = searchFilters.date?.from ? startOfDay(searchFilters.date.from) : null;
    const selectedTo = searchFilters.date?.to ? startOfDay(searchFilters.date.to) : null;

    return listings.filter((listing) => {
      const matchesCategory =
        filters.category === "all" ||
        listing.category === filters.category ||
        listing.type === filters.category;

      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        listing.location.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.area?.toLowerCase().includes(query) ||
        listing.province?.toLowerCase().includes(query);

      const minimumPrice = filters.minPrice ? Number.parseInt(filters.minPrice, 10) : 0;
      const maximumPrice = filters.maxPrice ? Number.parseInt(filters.maxPrice, 10) : Number.POSITIVE_INFINITY;
      const matchesPrice = listing.pricePerNight >= minimumPrice && listing.pricePerNight <= maximumPrice;

      const requestedGuests = searchFilters.guests || 0;
      const matchesGuests = requestedGuests <= 1 || (listing.adults + listing.children) >= requestedGuests;

      const matchesDateRange =
        !selectedFrom || !selectedTo || selectedTo < selectedFrom
          ? true
          : (() => {
              const blockedDates = new Set((listing.blockedDates || []).map((date) => date.slice(0, 10)));
              return eachDayOfInterval({ start: selectedFrom, end: selectedTo })
                .map((date) => format(date, "yyyy-MM-dd"))
                .every((dateKey) => !blockedDates.has(dateKey));
            })();

      const matchesAmenities = filters.amenities.every((amenity) => listing.amenities?.includes(amenity));
      const matchesFacilities = filters.facilities.every((facility) => listing.facilities?.includes(facility));
      const matchesProvince = filters.province === "all" || listing.province === filters.province;

      return (
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesGuests &&
        matchesDateRange &&
        matchesAmenities &&
        matchesFacilities &&
        matchesProvince
      );
    });
  }, [filters, listings, searchFilters]);

  const recentlyAddedListings = useMemo(
    () =>
      [...filteredListings]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 4),
    [filteredListings],
  );

  const spotlightListings = useMemo(
    () => (recentlyAddedListings.length > 0 ? recentlyAddedListings : filteredListings.slice(0, 4)),
    [filteredListings, recentlyAddedListings],
  );

  const heroListing = spotlightListings[0] ?? listings[0] ?? null;
  const provinceCount = useMemo(() => new Set(listings.map((listing) => listing.province)).size, [listings]);
  const averageNightlyRate = useMemo(() => {
    if (listings.length === 0) {
      return 0;
    }
    const total = listings.reduce((sum, listing) => sum + listing.pricePerNight, 0);
    return Math.round(total / listings.length);
  }, [listings]);

  const quickDestinations = useMemo(() => {
    const uniqueDestinations = new Set<string>();
    listings.forEach((listing) => {
      if (uniqueDestinations.size < 6) {
        uniqueDestinations.add(listing.location);
      }
    });
    return Array.from(uniqueDestinations);
  }, [listings]);

  const activeCategoryLabel = useMemo(() => resolveCategoryLabel(filters.category), [filters.category]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-[0_40px_120px_rgba(15,23,42,0.24)]">
          {heroListing ? (
            <img
              src={heroListing.images[0]}
              alt={heroListing.title}
              className="absolute inset-0 h-full w-full object-cover opacity-28"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.38),transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.9),rgba(15,23,42,0.82))]" />

          <div className="relative grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-12 lg:py-14">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-200">
                <Compass className="h-3.5 w-3.5" />
                South Africa, curated properly
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Find stays that actually feel worth the trip.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                  Search coast, bush, winelands, or mountain country without wading through noisy listing grids and weak filters.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  onClick={scrollToResults}
                >
                  Browse stays
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-white/8 px-5 text-sm font-semibold text-white hover:bg-white/12"
                  onClick={() => navigate("/planner")}
                >
                  Open trip planner
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-300">Live stays</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{listings.length}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-300">Provinces</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{provinceCount}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/12 bg-white/8 p-4 backdrop-blur">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-300">Average nightly</p>
                  <p className="mt-2 text-3xl font-semibold text-white">R{averageNightlyRate.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="self-end">
              <SearchFilterBar
                listings={listings}
                onChange={setSearchFilters}
                onSendMessage={(message) => navigate(`/planner?q=${encodeURIComponent(message)}`)}
                quickDestinations={quickDestinations}
              />
            </div>
          </div>
        </div>
      </section>

      <FilterBar
        activeCategory={filters.category}
        onFilterChange={(category) => setFilters((current) => ({ ...current, category }))}
        onOpenFilters={() => setIsFiltersOpen(true)}
        activeFiltersCount={activeFiltersCount}
      />

      <FiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      {spotlightListings.length > 0 ? (
        <FeaturedCarousel listings={spotlightListings} onListingClick={onBook} />
      ) : null}

      {recentlyAddedListings.length > 0 ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Fresh inventory
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Recently added
              </h2>
            </div>
            <p className="max-w-xl text-sm text-slate-500">
              New stays move here first, so this is the fastest way to catch fresh stock before it gets buried.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recentlyAddedListings.map((listing) => (
              <PropertyCard
                key={listing.id}
                listing={listing}
                onClick={onBook}
                compact
                showBorder
              />
            ))}
          </div>
        </section>
      ) : null}

      <section ref={resultsRef} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5" />
              {activeCategoryLabel}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {filteredListings.length} stay{filteredListings.length === 1 ? "" : "s"} ready to book
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Search remains practical, filters stay visible, and the results grid does the talking instead of drowning you in chrome.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-full border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                rawButtonVariants({ variant: viewMode === "grid" ? "primary" : "ghost", size: "sm" }),
                viewMode === "grid" ? null : "shadow-none",
              )}
            >
              <Rows3 className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                rawButtonVariants({ variant: viewMode === "map" ? "primary" : "ghost", size: "sm" }),
                viewMode === "map" ? null : "shadow-none",
              )}
            >
              <Map className="h-4 w-4" />
              Map
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <PropertyGrid listings={filteredListings} onListingClick={onBook} />
        ) : (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Map view</h3>
              <p className="text-sm text-slate-500">Spatial browsing is useful when the route matters more than the feed.</p>
            </div>
            <div className="h-[65vh] w-full">
              <PropertyMap listings={filteredListings} onListingClick={onBook} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
