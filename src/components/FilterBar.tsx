import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CATEGORY_ICONS } from "@/components/icons/CategoryIcons";
import { rawButtonVariants } from "@/components/ui/button";
import { CATEGORIES } from "@/constants/categories";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  activeCategory: string;
  onFilterChange: (category: string) => void;
  onOpenFilters: () => void;
  activeFiltersCount: number;
}

export default function FilterBar({
  activeCategory,
  activeFiltersCount,
  onFilterChange,
  onOpenFilters,
}: FilterBarProps) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsPinned(window.scrollY > 110);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const currentCategory = CATEGORIES.find((category) => category.id === activeCategory)
    ?? CATEGORIES.find((category) => category.subcategories.some((sub) => sub.id === activeCategory))
    ?? null;

  const activeSubCategory = currentCategory && currentCategory.id !== activeCategory ? activeCategory : null;

  return (
    <div
      className={cn(
        "sticky top-16 z-30 transition-all duration-200",
        isPinned ? "pt-2" : "pt-0",
      )}
    >
      <div className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="min-w-0 overflow-hidden">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={onOpenFilters}
              className={cn(
                rawButtonVariants({ variant: activeFiltersCount > 0 ? "primary" : "neutral" }),
                "relative shrink-0",
                activeFiltersCount > 0
                  ? "pr-3"
                  : null,
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1 text-[0.7rem] font-semibold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onFilterChange("all")}
              className={cn(
                rawButtonVariants({ variant: activeCategory === "all" ? "primary" : "neutral" }),
                "shrink-0",
              )}
            >
              All stays
            </button>

            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              const isActive = currentCategory?.id === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onFilterChange(isActive ? "all" : category.id)}
                  className={cn(
                    rawButtonVariants({ variant: isActive ? "primary" : "neutral" }),
                    "shrink-0",
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {currentCategory ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Refine {currentCategory.label}
            </span>
            {currentCategory.subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onFilterChange(subcategory.id)}
                className={cn(
                  rawButtonVariants({ variant: activeSubCategory === subcategory.id ? "primary" : "subtle", size: "sm" }),
                  activeSubCategory === subcategory.id
                    ? null
                    : "text-slate-700",
                )}
              >
                {subcategory.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
