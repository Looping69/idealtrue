import * as React from "react";
import Autoplay, { type AutoplayType } from "embla-carousel-autoplay";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { Listing } from "@/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { rawButtonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropertyCard from "./PropertyCard";

interface FeaturedCarouselProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
}

export default function FeaturedCarousel({ listings, onListingClick }: FeaturedCarouselProps) {
  const autoplayPlugin = React.useRef<AutoplayType>(
    Autoplay({ delay: 4200, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  if (listings.length === 0) {
    return null;
  }

  const heroListing = listings[0];

  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
        <div className="min-w-0 rounded-[2rem] bg-slate-950 px-6 py-7 text-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300">
            Spotlight stay
          </p>
          <div className="mt-4 space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight">{heroListing.title}</h2>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              {heroListing.description || "An editor-picked stay with strong setting, reliable host appeal, and a memorable point of view."}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="h-4 w-4" />
              {heroListing.location}, {heroListing.province}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onListingClick(heroListing)}
            className={cn(rawButtonVariants({ variant: "primary" }), "mt-6")}
          >
            Open featured stay
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 rounded-[2rem] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Handpicked now
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Featured stays
              </h3>
            </div>
            <div className="hidden gap-2 md:flex">
              <CarouselPrevious className="static translate-y-0 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white" />
              <CarouselNext className="static translate-y-0 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white" />
            </div>
          </div>

          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {listings.map((listing) => (
                <CarouselItem
                  key={listing.id}
                  className="pl-3 basis-[78%] sm:basis-[46%] lg:basis-[38%] xl:basis-[32%]"
                >
                  <PropertyCard listing={listing} onClick={onListingClick} compact showBorder />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-5 flex gap-2 md:hidden">
              <CarouselPrevious className="static translate-y-0 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white" />
              <CarouselNext className="static translate-y-0 border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
