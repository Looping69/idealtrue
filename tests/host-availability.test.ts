import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyAvailabilityRangeAction,
  buildDateKeysFromRange,
  buildManualBlockInputsFromDateKeys,
  getApprovedHoldDateKeys,
  getAvailabilityDayState,
  getBookedDateKeys,
  getManualBlockedDateKeys,
} from '../src/lib/host-availability.ts';

test('buildDateKeysFromRange includes both endpoints for manual host operations', () => {
  assert.deepEqual(buildDateKeysFromRange(new Date('2026-05-01T00:00:00.000Z'), new Date('2026-05-03T00:00:00.000Z')), [
    '2026-05-01',
    '2026-05-02',
    '2026-05-03',
  ]);
});

test('getBookedDateKeys excludes checkout day from occupancy', () => {
  const bookings = [
    {
      id: 'booking-1',
      listingId: 'listing-1',
      inquiryState: 'BOOKED',
      paymentState: 'COMPLETED',
      checkIn: '2026-06-10T00:00:00.000Z',
      checkOut: '2026-06-13T00:00:00.000Z',
    },
  ] as any;

  assert.deepEqual(getBookedDateKeys(bookings, 'listing-1'), ['2026-06-10', '2026-06-11', '2026-06-12']);
});

test('availability day state prioritizes booked and approved holds above manual blocks', () => {
  const params = {
    manualBlockedDateKeys: new Set(['2026-06-10']),
    approvedHoldDateKeys: new Set(['2026-06-11']),
    bookedDateKeys: new Set(['2026-06-12']),
  };

  assert.equal(getAvailabilityDayState('2026-06-10', params), 'manual_blocked');
  assert.equal(getAvailabilityDayState('2026-06-11', params), 'approved_hold');
  assert.equal(getAvailabilityDayState('2026-06-12', params), 'booked');
  assert.equal(getAvailabilityDayState('2026-06-13', params), 'available');
});

test('applyAvailabilityRangeAction blocks and unblocks while respecting locked dates', () => {
  const blocked = applyAvailabilityRangeAction({
    currentManualBlockedDateKeys: ['2026-06-01'],
    rangeDateKeys: ['2026-06-02', '2026-06-03'],
    action: 'block',
    lockedDateKeys: new Set(['2026-06-03']),
  });

  assert.deepEqual(blocked.nextManualBlockedDateKeys, ['2026-06-01', '2026-06-02']);
  assert.deepEqual(blocked.skippedDateKeys, ['2026-06-03']);

  const unblocked = applyAvailabilityRangeAction({
    currentManualBlockedDateKeys: blocked.nextManualBlockedDateKeys,
    rangeDateKeys: ['2026-06-01', '2026-06-02'],
    action: 'unblock',
    lockedDateKeys: new Set(),
  });

  assert.deepEqual(unblocked.nextManualBlockedDateKeys, []);
});

test('manual and approved hold date helpers normalize listing availability data', () => {
  const listing = {
    manualBlockedDates: ['2026-07-01T00:00:00.000Z'],
    availabilityBlocks: [
      {
        sourceType: 'APPROVED_HOLD',
        nights: ['2026-07-02', '2026-07-03'],
      },
    ],
  } as any;

  assert.deepEqual(getManualBlockedDateKeys(listing), ['2026-07-01']);
  assert.deepEqual(getApprovedHoldDateKeys(listing), ['2026-07-02', '2026-07-03']);
});

test('buildManualBlockInputsFromDateKeys compresses contiguous dates into intervals', () => {
  assert.deepEqual(
    buildManualBlockInputsFromDateKeys([
      '2026-08-01',
      '2026-08-02',
      '2026-08-04',
    ]),
    [
      {
        startsOn: '2026-08-01',
        endsOn: '2026-08-03',
        note: null,
      },
      {
        startsOn: '2026-08-04',
        endsOn: '2026-08-05',
        note: null,
      },
    ],
  );
});

test('buildManualBlockInputsFromDateKeys preserves notes only for unchanged intervals', () => {
  const existingManualBlocks = [
    {
      sourceType: 'MANUAL',
      startsOn: '2026-09-01',
      endsOn: '2026-09-03',
      note: 'Maintenance window',
    },
    {
      sourceType: 'MANUAL',
      startsOn: '2026-09-05',
      endsOn: '2026-09-06',
      note: 'Owner stay',
    },
  ] as any;

  assert.deepEqual(
    buildManualBlockInputsFromDateKeys(
      ['2026-09-01', '2026-09-02', '2026-09-05'],
      existingManualBlocks,
      'Fresh note',
    ),
    [
      {
        startsOn: '2026-09-01',
        endsOn: '2026-09-03',
        note: 'Maintenance window',
      },
      {
        startsOn: '2026-09-05',
        endsOn: '2026-09-06',
        note: 'Owner stay',
      },
    ],
  );

  assert.deepEqual(
    buildManualBlockInputsFromDateKeys(
      ['2026-09-01', '2026-09-02', '2026-09-03'],
      existingManualBlocks,
      'Fresh note',
    ),
    [
      {
        startsOn: '2026-09-01',
        endsOn: '2026-09-04',
        note: 'Fresh note',
      },
    ],
  );
});
