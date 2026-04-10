import { useEffect, useRef, useState } from 'react';
import type { Booking, Listing, Referral } from '@/types';
import type { AuthSessionUser } from '@/contexts/AuthContext';
import { isBookedStay } from '@/lib/inquiry-state';
import { getListing, listHostListings, listMyBookings, listPublicListings, listReferralRewards } from '@/lib/platform-client';

const BOOKING_POLL_INTERVAL_MS = 15_000;

interface PlatformDataState {
  listings: Listing[];
  myListings: Listing[];
  myBookings: Booking[];
  hostBookings: Booking[];
  referrals: Referral[];
  syncUpdatedBooking: (updatedBooking: Booking) => void;
  syncUpdatedListing: (updatedListing: Listing) => void;
  removeListing: (listingId: string) => void;
}

function applyBookings(
  allBookings: Booking[],
  userId: string,
  setMyBookings: React.Dispatch<React.SetStateAction<Booking[]>>,
  setHostBookings: React.Dispatch<React.SetStateAction<Booking[]>>,
) {
  setMyBookings(allBookings.filter((booking) => booking.guestId === userId));
  setHostBookings(allBookings.filter((booking) => booking.hostId === userId));
}

export function usePlatformData(user: AuthSessionUser | null): PlatformDataState {
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const [publicListings, sessionBookings, rewardHistory] = await Promise.all([
        listPublicListings(),
        user ? listMyBookings() : Promise.resolve([]),
        user ? listReferralRewards() : Promise.resolve([]),
      ]);

      if (cancelled) {
        return;
      }

      setListings(publicListings);
      setReferrals(rewardHistory);

      if (!user) {
        setMyListings([]);
        setMyBookings([]);
        setHostBookings([]);
        return;
      }

      const hostListings = await listHostListings(user.id);
      if (cancelled) {
        return;
      }

      setMyListings(hostListings);
      applyBookings(sessionBookings, user.id, setMyBookings, setHostBookings);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refreshBookings = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      const currentUser = userRef.current;
      if (!currentUser) {
        return;
      }
      try {
        const latestBookings = await listMyBookings();
        applyBookings(latestBookings, currentUser.id, setMyBookings, setHostBookings);
      } catch (error) {
        console.warn('Failed to refresh bookings:', error);
      }
    };

    const interval = window.setInterval(() => {
      void refreshBookings();
    }, BOOKING_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [user]);

  return {
    listings,
    myListings,
    myBookings,
    hostBookings,
    referrals,
    syncUpdatedBooking(updatedBooking) {
      setMyBookings((current) => {
        const existingIndex = current.findIndex((item) => item.id === updatedBooking.id);
        if (existingIndex === -1 && updatedBooking.guestId === user?.id) {
          return [updatedBooking, ...current];
        }
        return current.map((item) => item.id === updatedBooking.id ? updatedBooking : item);
      });
      setHostBookings((current) => {
        const existingIndex = current.findIndex((item) => item.id === updatedBooking.id);
        if (existingIndex === -1 && updatedBooking.hostId === user?.id) {
          return [updatedBooking, ...current];
        }
        return current.map((item) => item.id === updatedBooking.id ? updatedBooking : item);
      });

      if (isBookedStay(updatedBooking) || ['DECLINED', 'EXPIRED'].includes(updatedBooking.inquiryState)) {
        void getListing(updatedBooking.listingId)
          .then((updatedListing) => {
            setListings((current) => current.map((item) => item.id === updatedListing.id ? updatedListing : item));
            setMyListings((current) => current.map((item) => item.id === updatedListing.id ? updatedListing : item));
          })
          .catch((error) => {
            console.warn("Failed to refresh listing availability after booking update:", error);
          });
      }
    },
    syncUpdatedListing(updatedListing) {
      setListings((current) => {
        const existingIndex = current.findIndex((item) => item.id === updatedListing.id);
        if (existingIndex === -1) {
          return [updatedListing, ...current];
        }
        return current.map((item) => item.id === updatedListing.id ? updatedListing : item);
      });
      setMyListings((current) => {
        const existingIndex = current.findIndex((item) => item.id === updatedListing.id);
        if (existingIndex === -1 && updatedListing.hostId === user?.id) {
          return [updatedListing, ...current];
        }
        return current.map((item) => item.id === updatedListing.id ? updatedListing : item);
      });
    },
    removeListing(listingId) {
      setListings((current) => current.filter((item) => item.id !== listingId));
      setMyListings((current) => current.filter((item) => item.id !== listingId));
    },
  };
}
