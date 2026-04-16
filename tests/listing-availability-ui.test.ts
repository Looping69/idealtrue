import assert from 'node:assert/strict';
import test from 'node:test';

import { isListingNightBlocked, stayOverlapsListingAvailability } from '../src/lib/listing-availability.ts';

test('stayOverlapsListingAvailability hides listings when requested nights hit a booked block', () => {
  const listing = {
    blockedDates: [],
    availabilityBlocks: [
      {
        id: 'booked-1',
        listingId: 'listing-1',
        sourceType: 'BOOKED' as const,
        sourceId: 'booking-1',
        startsOn: '2026-08-10',
        endsOn: '2026-08-13',
        nights: ['2026-08-10', '2026-08-11', '2026-08-12'],
        bookingId: 'booking-1',
        createdAt: '2026-04-16T08:00:00.000Z',
        updatedAt: '2026-04-16T08:00:00.000Z',
      },
    ],
  };

  assert.equal(
    stayOverlapsListingAvailability(
      listing,
      new Date('2026-08-11T00:00:00.000Z'),
      new Date('2026-08-14T00:00:00.000Z'),
    ),
    true,
  );
});

test('stayOverlapsListingAvailability treats checkout as end-exclusive', () => {
  const listing = {
    blockedDates: ['2026-08-10'],
    availabilityBlocks: [],
  };

  assert.equal(
    stayOverlapsListingAvailability(
      listing,
      new Date('2026-08-09T00:00:00.000Z'),
      new Date('2026-08-10T00:00:00.000Z'),
    ),
    false,
  );
});

test('isListingNightBlocked checks explicit night blocks for calendar disabling', () => {
  const listing = {
    blockedDates: ['2026-08-10'],
    availabilityBlocks: [],
  };

  assert.equal(isListingNightBlocked(listing, new Date('2026-08-10T00:00:00.000Z')), true);
  assert.equal(isListingNightBlocked(listing, new Date('2026-08-11T00:00:00.000Z')), false);
});
