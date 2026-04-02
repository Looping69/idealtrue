import { useEffect, useState } from "react";
import { X, Check, Minus, Plus } from "lucide-react";
import { Button, rawButtonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AMENITIES, FACILITIES, PROVINCES } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type ListingFilters = {
  minPrice: string;
  maxPrice: string;
  adults: number;
  children: number;
  amenities: string[];
  facilities: string[];
  province: string;
  category: string;
};

const DEFAULT_FILTERS: ListingFilters = {
  minPrice: "",
  maxPrice: "",
  adults: 0,
  children: 0,
  amenities: [],
  facilities: [],
  province: "all",
  category: "all",
};

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ListingFilters) => void;
  initialFilters: ListingFilters;
}

export default function FiltersModal({ isOpen, onClose, onApply, initialFilters }: FiltersModalProps) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(initialFilters);
    }
  }, [initialFilters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
  };

  const toggleItem = (field: "amenities" | "facilities", item: string) => {
    setFilters((current) => {
      const list = current[field];
      const nextList = list.includes(item)
        ? list.filter((value) => value !== item)
        : [...list, item];
      return { ...current, [field]: nextList };
    });
  };

  const updateCount = (field: "adults" | "children", delta: number) => {
    setFilters((current) => ({
      ...current,
      [field]: Math.max(0, current[field] + delta),
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-dim/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-surface sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(rawButtonVariants({ variant: "ghost", size: "sm" }), "shadow-none")}
          >
            Clear all
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Price Range */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Price range</h3>
            <p className="text-sm text-on-surface-variant">Nightly prices before fees and taxes</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-on-surface-variant">Minimum</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">R</span>
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="pl-7"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="w-4 h-px bg-surface-container-high mt-6" />
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-on-surface-variant">Maximum</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">R</span>
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="pl-7"
                    placeholder="10000+"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Guests */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Guests</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Adults</div>
                  <div className="text-sm text-on-surface-variant">Ages 13 or above</div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updateCount("adults", -1)}
                    disabled={filters.adults <= 0}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-medium">{filters.adults}</span>
                  <button
                    type="button"
                    onClick={() => updateCount("adults", 1)}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Children</div>
                  <div className="text-sm text-on-surface-variant">Ages 2–12</div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updateCount("children", -1)}
                    disabled={filters.children <= 0}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-medium">{filters.children}</span>
                  <button
                    type="button"
                    onClick={() => updateCount("children", 1)}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Province */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Province</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilters({ ...filters, province: "all" })}
                className={cn(
                  rawButtonVariants({ variant: filters.province === "all" ? "primary" : "neutral" }),
                  filters.province === "all" ? null : "text-slate-700"
                )}
              >
                All Provinces
              </button>
              {PROVINCES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilters({ ...filters, province: p })}
                  className={cn(
                    rawButtonVariants({ variant: filters.province === p ? "primary" : "neutral" }),
                    filters.province === p ? null : "text-slate-700"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Amenities */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Amenities</h3>
            <div className="grid grid-cols-2 gap-4">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleItem("amenities", amenity)}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                    filters.amenities.includes(amenity) ? "bg-gradient-to-r from-slate-900 to-blue-600 border-transparent text-white" : "border-outline-variant group-hover:border-primary"
                  )}>
                    {filters.amenities.includes(amenity) && <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-on-surface">{amenity}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Facilities */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Onsite Facilities</h3>
            <div className="grid grid-cols-2 gap-4">
              {FACILITIES.filter(f => f !== "Other").map((facility) => (
                <button
                  key={facility}
                  onClick={() => toggleItem("facilities", facility)}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                    filters.facilities.includes(facility) ? "bg-gradient-to-r from-slate-900 to-blue-600 border-transparent text-white" : "border-outline-variant group-hover:border-primary"
                  )}>
                    {filters.facilities.includes(facility) && <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-on-surface">{facility}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between bg-surface sticky bottom-0 z-10">
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(rawButtonVariants({ variant: "ghost", size: "sm" }), "shadow-none")}
          >
            Clear all
          </button>
          <Button onClick={handleApply} className="rounded-xl px-8 py-6 text-base font-bold">
            Show results
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
