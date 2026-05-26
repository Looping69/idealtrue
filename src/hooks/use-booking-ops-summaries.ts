import { useEffect, useState } from 'react';

import type { Booking, BookingOpsSummary } from '@/types';
import { getBookingOpsSummary } from '@/lib/platform-client';

export function useBookingOpsSummaries(bookings: Booking[]) {
  const [summaries, setSummaries] = useState<Record<string, BookingOpsSummary>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      if (!bookings.length) {
        if (!cancelled) {
          setSummaries({});
        }
        return;
      }

      const results = await Promise.allSettled(
        bookings.map(async (booking) => ({
          id: booking.id,
          summary: await getBookingOpsSummary(booking.id),
        })),
      );

      if (cancelled) {
        return;
      }

      const nextSummaries: Record<string, BookingOpsSummary> = {};
      for (const result of results) {
        if (result.status === 'fulfilled') {
          nextSummaries[result.value.id] = result.value.summary;
        }
      }

      setSummaries(nextSummaries);
    }

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [bookings]);

  return summaries;
}
