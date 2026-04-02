import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Minus,
  Plus,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { Button, rawButtonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/types";

export type SearchFilterState = {
  query: string;
  guests: number;
  date?: {
    from?: Date;
    to?: Date;
  };
};

type Suggestion = {
  label: string;
  type: "province" | "place" | "listing" | "city";
  icon?: LucideIcon;
};

type Props = {
  onChange: (state: SearchFilterState) => void;
  onModeChange?: (mode: "chat" | "search") => void;
  onSendMessage?: (message: string) => void;
  mode?: "chat" | "search";
  listings?: Listing[];
  quickDestinations?: string[];
};

const POPULAR_DESTINATIONS: Suggestion[] = [
  { label: "Cape Town", type: "city", icon: TrendingUp },
  { label: "Durban", type: "city", icon: TrendingUp },
  { label: "Kruger National Park", type: "place", icon: MapPin },
  { label: "Garden Route", type: "place", icon: MapPin },
  { label: "Western Cape", type: "province", icon: MapPin },
  { label: "Winelands", type: "place", icon: MapPin },
];

const PLANNER_PROMPTS = [
  "Family beach break with space for 4",
  "Romantic safari weekend under R3,500",
  "Quiet work retreat with strong wifi",
];

const fieldChrome =
  "rounded-[1.4rem] border border-slate-200/80 bg-white/92 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300";

export default function SearchFilterBar({
  onChange,
  onModeChange,
  onSendMessage,
  mode = "search",
  listings = [],
  quickDestinations = [],
}: Props) {
  const [activeMode, setActiveMode] = useState<"chat" | "search">(mode);
  const [message, setMessage] = useState("");
  const [showCheckInCal, setShowCheckInCal] = useState(false);
  const [showCheckOutCal, setShowCheckOutCal] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) {
        return;
      }
      setShowSuggestions(false);
      setShowCheckInCal(false);
      setShowCheckOutCal(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  const emit = (
    nextLocation = location,
    nextGuests = guests,
    from = checkIn ?? undefined,
    to = checkOut ?? undefined,
  ) => {
    onChange({ query: nextLocation, guests: nextGuests, date: { from, to } });
  };

  const switchMode = (nextMode: "chat" | "search") => {
    setActiveMode(nextMode);
    setShowSuggestions(false);
    setShowCheckInCal(false);
    setShowCheckOutCal(false);
    onModeChange?.(nextMode);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const days: Date[] = [];
    for (let index = 0; index < 42; index += 1) {
      days.push(new Date(today.getFullYear(), today.getMonth(), index - today.getDay() + 1));
    }
    return days;
  };

  const handleLocationFocus = () => {
    setShowSuggestions(true);
    if (!location.trim()) {
      setSuggestions(POPULAR_DESTINATIONS);
    }
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    emit(value);
    setShowSuggestions(true);
    setActiveIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setSuggestions(POPULAR_DESTINATIONS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      const normalizedQuery = value.toLowerCase();
      const matchedListings = listings.filter((listing) =>
        listing.title.toLowerCase().includes(normalizedQuery) ||
        listing.location.toLowerCase().includes(normalizedQuery) ||
        listing.area?.toLowerCase().includes(normalizedQuery) ||
        listing.province?.toLowerCase().includes(normalizedQuery),
      );

      const places = new Set<string>();
      const provinces = new Set<string>();
      const listingSuggestions: Suggestion[] = [];

      matchedListings.forEach((listing) => {
        if (listing.location) {
          places.add(listing.location);
        }
        if (listing.province && listing.province.toLowerCase().includes(normalizedQuery)) {
          provinces.add(listing.province);
        }
        if (listing.title.toLowerCase().includes(normalizedQuery) && listingSuggestions.length < 3) {
          listingSuggestions.push({ label: listing.title, type: "listing", icon: Sparkles });
        }
      });

      const nextSuggestions: Suggestion[] = [
        ...Array.from(provinces).slice(0, 2).map((label) => ({ label, type: "province" as const, icon: MapPin })),
        ...Array.from(places).slice(0, 4).map((label) => ({ label, type: "place" as const, icon: MapPin })),
        ...listingSuggestions,
      ];

      setSuggestions(nextSuggestions);
      setIsLoading(false);
    }, 220);
  };

  const pickSuggestion = (suggestion: Suggestion) => {
    setLocation(suggestion.label);
    emit(suggestion.label);
    setShowSuggestions(false);
  };

  const onLocationKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(suggestions.length - 1, index + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) {
      return "Add dates";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDateSelect = (date: Date, type: "checkin" | "checkout") => {
    if (type === "checkin") {
      setCheckIn(date);
      setShowCheckInCal(false);
      setShowCheckOutCal(true);
      emit(location, guests, date, checkOut ?? undefined);
      return;
    }

    setCheckOut(date);
    setShowCheckOutCal(false);
    emit(location, guests, checkIn ?? undefined, date);
  };

  const handlePlannerSend = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    onSendMessage?.(trimmed);
  };

  const CalendarDropdown = ({
    minDate,
    onSelect,
    selectedDate,
    type,
  }: {
    minDate?: Date | null;
    onSelect: (date: Date) => void;
    selectedDate: Date | null;
    type: "checkin" | "checkout";
  }) => {
    const days = generateCalendarDays();
    const today = new Date();
    const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
      <div className="absolute left-0 top-full z-40 mt-3 w-[min(22rem,calc(100vw-2.5rem))] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_28px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {type === "checkin" ? "Check in" : "Check out"}
            </p>
            <h3 className="text-sm font-semibold text-slate-900">{monthName}</h3>
          </div>
          <CalendarDays className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const key = date.toISOString();
            const isToday = date.toDateString() === today.toDateString();
            const isPast = date < today && !isToday;
            const isBeforeMinimum = minDate && date < minDate;
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={key}
                type="button"
                disabled={isPast || isBeforeMinimum}
                onClick={() => !isPast && !isBeforeMinimum && onSelect(date)}
                className={cn(
                  "h-9 rounded-xl text-sm transition-colors",
                  isPast || isBeforeMinimum
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-700 hover:bg-slate-100",
                  isToday && "font-semibold text-primary",
                  isSelected && "bg-slate-900 text-white hover:bg-slate-900",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const destinationChips = quickDestinations.length > 0
    ? quickDestinations
    : POPULAR_DESTINATIONS.map((destination) => destination.label);

  return (
    <div ref={wrapperRef} className="w-full">
      <div className="rounded-[2rem] border border-white/45 bg-white/86 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("search")}
              className={cn(
                rawButtonVariants({ variant: activeMode === "search" ? "primary" : "ghost", size: "sm" }),
                activeMode === "search" ? null : "shadow-none",
              )}
            >
              Search stays
            </button>
            <button
              type="button"
              onClick={() => switchMode("chat")}
              className={cn(
                rawButtonVariants({ variant: activeMode === "chat" ? "primary" : "ghost", size: "sm" }),
                activeMode === "chat" ? null : "shadow-none",
              )}
            >
              AI planner
            </button>
          </div>
          <p className="max-w-sm text-sm text-slate-500">
            {activeMode === "search"
              ? "Search by destination, refine by dates, then move fast."
              : "Describe the trip in plain English and let the planner do the heavy lifting."}
          </p>
        </div>

        {activeMode === "search" ? (
          <div className="space-y-4 pt-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.72fr)_auto]">
              <div className={cn(fieldChrome, "relative")}>
                <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  Where to
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  onFocus={handleLocationFocus}
                  onKeyDown={onLocationKeyDown}
                  placeholder="Cape Town, safari, coast, winelands..."
                  className="w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />

                {showSuggestions && (
                  <div className="absolute left-0 top-full z-40 mt-3 w-full overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_28px_60px_rgba(15,23,42,0.14)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {location.trim() ? "Matches" : "Popular right now"}
                      </div>
                    </div>
                    {isLoading ? (
                      <div className="px-4 py-5 text-sm text-slate-500">Searching destinations…</div>
                    ) : suggestions.length > 0 ? (
                      <ul className="py-2">
                        {suggestions.map((suggestion, index) => {
                          const Icon = suggestion.icon ?? MapPin;

                          return (
                            <li key={`${suggestion.type}-${suggestion.label}`}>
                              <button
                                type="button"
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => pickSuggestion(suggestion)}
                                className={cn(
                                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                                  activeIndex === index ? "bg-slate-50" : "hover:bg-slate-50",
                                )}
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-900">{suggestion.label}</div>
                                  <div className="text-xs capitalize text-slate-500">
                                    {suggestion.type === "listing" ? "Property" : suggestion.type}
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="px-4 py-5 text-sm text-slate-500">
                        No destination matched that search.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={cn(fieldChrome, "relative")}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckInCal((open) => !open);
                    setShowCheckOutCal(false);
                  }}
                  className="w-full text-left"
                >
                  <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Check in
                  </div>
                  <div className="text-base font-medium text-slate-900">{formatDate(checkIn)}</div>
                </button>
                {showCheckInCal && (
                  <CalendarDropdown
                    type="checkin"
                    selectedDate={checkIn}
                    onSelect={(date) => handleDateSelect(date, "checkin")}
                  />
                )}
              </div>

              <div className={cn(fieldChrome, "relative")}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckOutCal((open) => !open);
                    setShowCheckInCal(false);
                  }}
                  className="w-full text-left"
                >
                  <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Check out
                  </div>
                  <div className="text-base font-medium text-slate-900">{formatDate(checkOut)}</div>
                </button>
                {showCheckOutCal && (
                  <CalendarDropdown
                    type="checkout"
                    minDate={checkIn}
                    selectedDate={checkOut}
                    onSelect={(date) => handleDateSelect(date, "checkout")}
                  />
                )}
              </div>

              <div className={fieldChrome}>
                <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Guests
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const nextGuests = Math.max(1, guests - 1);
                      setGuests(nextGuests);
                      emit(location, nextGuests);
                    }}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-10 text-center text-lg font-semibold text-slate-900">{guests}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextGuests = guests + 1;
                      setGuests(nextGuests);
                      emit(location, nextGuests);
                    }}
                    className={rawButtonVariants({ variant: "neutral", size: "icon-sm" })}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="h-full min-h-16 rounded-[1.4rem] bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={() => emit()}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Quick starts
              </span>
              {destinationChips.slice(0, 6).map((destination) => (
                <button
                  key={destination}
                  type="button"
                  onClick={() => {
                    setLocation(destination);
                    emit(destination);
                    setShowSuggestions(false);
                  }}
                  className={cn(rawButtonVariants({ variant: "neutral", size: "sm" }), "text-slate-700")}
                >
                  {destination}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                <Wand2 className="h-3.5 w-3.5" />
                Planner prompt
              </div>
              <textarea
                rows={3}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Plan a long weekend with one luxury stay, one family stop, and a scenic route between them."
                className="w-full resize-none bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PLANNER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setMessage(prompt)}
                  className={cn(rawButtonVariants({ variant: "neutral", size: "sm" }), "text-slate-700")}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-lg text-sm text-slate-500">
                The planner can route around province, mood, budget, and guest count without you hand-building the itinerary.
              </p>
              <Button
                type="button"
                size="lg"
                className="h-12 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
                onClick={handlePlannerSend}
              >
                <Send className="h-4 w-4" />
                Launch planner
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
