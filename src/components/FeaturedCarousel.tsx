import * as React from "react";
import { Listing } from "@/types";
import PropertyCard from "./PropertyCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay, { type AutoplayType } from "embla-carousel-autoplay";

interface FeaturedCarouselProps {
    listings: Listing[];
    onListingClick: (listing: Listing) => void;
}

export default function FeaturedCarousel({ listings, onListingClick }: FeaturedCarouselProps) {
    const autoplayPlugin = React.useRef<AutoplayType>(
        Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    if (listings.length === 0) return null;

    return (
        <section className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] mb-10 w-screen overflow-visible border-y border-outline-variant bg-[#f8fbff] py-8 sm:py-10">
            <div className="mx-auto mb-6 w-full max-w-[1600px] px-5 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-on-surface tracking-tight font-primary">Featured Stays</h2>
                    </div>
                </div>
            </div>

            <div className="relative w-full px-5 sm:px-6 lg:px-8">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[autoplayPlugin.current]}
                    className="mx-auto w-full max-w-[1600px] overflow-visible"
                >
                    <CarouselContent className="-ml-4 md:-ml-5">
                        {listings.map((listing) => (
                            <CarouselItem key={listing.id} className="basis-full pl-4 sm:basis-[78%] md:basis-1/2 md:pl-5 lg:basis-[31%] xl:basis-1/4 2xl:basis-[22%]">
                                <div className="p-0.5 h-full">
                                    <div className="transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-gray-200 rounded-2xl h-full">
                                        <PropertyCard listing={listing} onClick={onListingClick} showBorder={true} />
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="mt-6 flex justify-end gap-3 md:absolute md:-top-16 md:right-0">
                        <CarouselPrevious className="static min-w-[4.75rem] translate-y-0 rounded-xl border-transparent bg-[#08a8c8] px-4 text-white shadow-lg shadow-[#08a8c8]/20 hover:bg-[#08a8c8]/90" />
                        <CarouselNext className="static min-w-[4.75rem] translate-y-0 rounded-xl border-transparent bg-[#08a8c8] px-4 text-white shadow-lg shadow-[#08a8c8]/20 hover:bg-[#08a8c8]/90" />
                    </div>
                </Carousel>
            </div>
        </section>
    );
}
