import { eachDayOfInterval, format, isAfter, parseISO, startOfDay } from 'date-fns';

import type { Booking, Listing, ListingAvailabilityBlock, ListingAvailabilityManualBlockInput } from '@/types';
import { isBookedStay } from '@/lib/inquiry-state';

export type AvailabilityDayState = 'available' | 'manual_blocked' | 'approved_hold' | 'booked';

export function normalizeDateKey(date: Date | string) {
  if (date instanceof Date) {
    return format(date, 'yyyy-MM-dd');
  }

  return `${date}`.trim().slice(0, 10);
}

export function buildDateKeysFromRange(start: Date, end: Date) {
  const normalizedStart = startOfDay(start);
  const normalizedEnd = startOfDay(end);
  const [from, to] = isAfter(normalizedStart, normalizedEnd)
    ? [normalizedEnd, normalizedStart]
    : [normalizedStart, normalizedEnd];

  return eachDayOfInterval({ start: from, end: to }).map((date) => normalizeDateKey(date));
}

export function buildManualBlockInputsFromDateKeys(
  dateKeys: string[],
  existingManualBlocks: ListingAvailabilityBlock[] = [],
  defaultNote?: string | null,
): ListingAvailabilityManualBlockInput[] {
  const normalizedDateKeys = Array.from(new Set((dateKeys ?? []).map(normalizeDateKey))).sort();
  if (normalizedDateKeys.length === 0) {
    return [];
  }

  const existingNotesByInterval = new Map(
    existingManualBlocks
      .filter((block) => block.sourceType === 'MANUAL')
      .map((block) => [`${normalizeDateKey(block.startsOn)}:${normalizeDateKey(block.endsOn)}`, block.note ?? null]),
  );

  const intervals: ListingAvailabilityManualBlockInput[] = [];
  let intervalStart = normalizedDateKeys[0]!;
  let previousDate = parseISO(intervalStart);

  for (let index = 1; index < normalizedDateKeys.length; index += 1) {
    const currentDateKey = normalizedDateKeys[index]!;
    const currentDate = parseISO(currentDateKey);
    const expectedNext = normalizeDateKey(eachDayOfInterval({ start: previousDate, end: addDay(previousDate) })[1]!);

    if (currentDateKey !== expectedNext) {
      const endsOn = normalizeDateKey(addDay(previousDate));
      const preservedNote = existingNotesByInterval.get(`${intervalStart}:${endsOn}`) ?? defaultNote ?? null;
      intervals.push({ startsOn: intervalStart, endsOn, note: preservedNote });
      intervalStart = currentDateKey;
    }

    previousDate = currentDate;
  }

  const finalEndsOn = normalizeDateKey(addDay(previousDate));
  const finalNote = existingNotesByInterval.get(`${intervalStart}:${finalEndsOn}`) ?? defaultNote ?? null;
  intervals.push({ startsOn: intervalStart, endsOn: finalEndsOn, note: finalNote });

  return intervals;
}

function addDay(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export function getBookedDateKeys(bookings: Booking[], listingId: string) {
  return bookings
    .filter((booking) => booking.listingId === listingId && isBookedStay(booking))
    .flatMap((booking) =>
      buildDateKeysFromRange(parseISO(booking.checkIn), parseISO(booking.checkOut)).slice(0, -1),
    );
}

export function getApprovedHoldDateKeys(listing?: Listing | null) {
  return (listing?.availabilityBlocks ?? [])
    .filter((block) => block.sourceType === 'APPROVED_HOLD')
    .flatMap((block) => block.nights)
    .map(normalizeDateKey);
}

export function getManualBlockedDateKeys(listing?: Listing | null) {
  return (listing?.manualBlockedDates ?? []).map(normalizeDateKey);
}

export function getAvailabilityDayState(
  dateKey: string,
  params: {
    manualBlockedDateKeys: Set<string>;
    approvedHoldDateKeys: Set<string>;
    bookedDateKeys: Set<string>;
  },
): AvailabilityDayState {
  if (params.bookedDateKeys.has(dateKey)) {
    return 'booked';
  }

  if (params.approvedHoldDateKeys.has(dateKey)) {
    return 'approved_hold';
  }

  if (params.manualBlockedDateKeys.has(dateKey)) {
    return 'manual_blocked';
  }

  return 'available';
}

export function applyAvailabilityRangeAction(params: {
  currentManualBlockedDateKeys: string[];
  rangeDateKeys: string[];
  action: 'block' | 'unblock';
  lockedDateKeys: Set<string>;
}) {
  const current = new Set(params.currentManualBlockedDateKeys.map(normalizeDateKey));
  const skippedDateKeys: string[] = [];

  for (const dateKey of params.rangeDateKeys.map(normalizeDateKey)) {
    if (params.lockedDateKeys.has(dateKey)) {
      skippedDateKeys.push(dateKey);
      continue;
    }

    if (params.action === 'block') {
      current.add(dateKey);
    } else {
      current.delete(dateKey);
    }
  }

  return {
    nextManualBlockedDateKeys: [...current].sort(),
    skippedDateKeys,
  };
}
