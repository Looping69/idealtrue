import type { Listing, ListingAvailabilityBlock } from '@/types';

function normalizeDateOnly(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return `${value}`.trim().slice(0, 10);
}

function collectBlockedNights(listing: Pick<Listing, 'blockedDates' | 'availabilityBlocks'>) {
  if ((listing.availabilityBlocks?.length ?? 0) > 0) {
    return new Set(
      listing.availabilityBlocks!.flatMap((block: ListingAvailabilityBlock) =>
        (block.nights ?? []).map((night) => normalizeDateOnly(night)),
      ),
    );
  }

  return new Set((listing.blockedDates ?? []).map((night) => normalizeDateOnly(night)));
}

export function isListingNightBlocked(listing: Pick<Listing, 'blockedDates' | 'availabilityBlocks'>, date: Date) {
  return collectBlockedNights(listing).has(normalizeDateOnly(date));
}

export function stayOverlapsListingAvailability(
  listing: Pick<Listing, 'blockedDates' | 'availabilityBlocks'>,
  checkIn?: Date | null,
  checkOut?: Date | null,
) {
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return false;
  }

  const blockedNights = collectBlockedNights(listing);
  if (blockedNights.size === 0) {
    return false;
  }

  for (let cursor = new Date(checkIn); cursor < checkOut; cursor.setDate(cursor.getDate() + 1)) {
    if (blockedNights.has(normalizeDateOnly(cursor))) {
      return true;
    }
  }

  return false;
}
