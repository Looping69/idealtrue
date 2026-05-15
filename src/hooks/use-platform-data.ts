import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Booking, Listing, Referral, UserProfile } from '@/types';
import type { AuthSessionUser } from '@/contexts/AuthContext';
import { getEncoreErrorMessage } from '@/lib/encore-client';
import { isBookedStay } from '@/lib/inquiry-state';
import { getListing, listHostListings, listMyBookings, listPublicListings, listReferralRewards } from '@/lib/platform-client';

type PlatformDataErrorKey = 'listings' | 'bookings' | 'hostListings' | 'referrals';

type PlatformDataErrors = Partial<Record<PlatformDataErrorKey, string>>;

type PlatformDataLoading = Record<PlatformDataErrorKey, boolean>;

interface PlatformDataState {
  listings: Listing[];
  myListings: Listing[];
  myBookings: Booking[];
  hostBookings: Booking[];
  referrals: Referral[];
  dataErrors: PlatformDataErrors;
  dataLoading: PlatformDataLoading;
  hasDataErrors: boolean;
  reloadPlatformData: () => void;
  syncUpdatedBooking: (updatedBooking: Booking) => void;
  syncUpdatedListing: (updatedListing: Listing) => void;
  removeListing: (listingId: string) => void;
}

const EMPTY_LOADING_STATE: PlatformDataLoading = {
  listings: false,
  bookings: false,
  hostListings: false,
  referrals: false,
};

function toDataError(error: unknown, fallback: string) {
  return getEncoreErrorMessage(error, fallback);
}

export function usePlatformData(user: AuthSessionUser | null, profile: UserProfile | null): PlatformDataState {
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [dataErrors, setDataErrors] = useState<PlatformDataErrors>({});
  const [dataLoading, setDataLoading] = useState<PlatformDataLoading>(EMPTY_LOADING_STATE);
  const [reloadKey, setReloadKey] = useState(0);

  const canLoadHostData = Boolean(
    user &&
    profile &&
    (profile.role === 'host' || profile.role === 'admin' || profile.isAdmin),
  );

  const setLoadingFlag = useCallback((key: PlatformDataErrorKey, loading: boolean) => {
    setDataLoading((current) => ({ ...current, [key]: loading }));
  }, []);

  const setDataError = useCallback((key: PlatformDataErrorKey, message?: string) => {
    setDataErrors((current) => {
      const next = { ...current };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safelySetLoadingFlag = (key: PlatformDataErrorKey, loadingState: boolean) => {
      if (!cancelled) {
        setLoadingFlag(key, loadingState);
      }
    };

    const safelySetDataError = (key: PlatformDataErrorKey, message?: string) => {
      if (!cancelled) {
        setDataError(key, message);
      }
    };

    async function loadPublicListings() {
      safelySetLoadingFlag('listings', true);
      try {
        const publicListings = await listPublicListings();
        if (!cancelled) {
          setListings(publicListings);
          safelySetDataError('listings');
        }
      } catch (error) {
        console.error('Failed to load public listings:', error);
        safelySetDataError('listings', toDataError(error, 'Could not load public listings.'));
      } finally {
        safelySetLoadingFlag('listings', false);
      }
    }

    async function loadBookings() {
      if (!user) {
        setMyBookings([]);
        setHostBookings([]);
        safelySetDataError('bookings');
        safelySetLoadingFlag('bookings', false);
        return;
      }

      safelySetLoadingFlag('bookings', true);
      try {
        const sessionBookings = await listMyBookings();
        if (!cancelled) {
          setMyBookings(sessionBookings.filter((booking) => booking.guestId === user.id));
          setHostBookings(sessionBookings.filter((booking) => booking.hostId === user.id));
          safelySetDataError('bookings');
        }
      } catch (error) {
        console.error('Failed to load bookings:', error);
        safelySetDataError('bookings', toDataError(error, 'Could not load bookings.'));
      } finally {
        safelySetLoadingFlag('bookings', false);
      }
    }

    async function loadReferrals() {
      if (!user) {
        setReferrals([]);
        safelySetDataError('referrals');
        safelySetLoadingFlag('referrals', false);
        return;
      }

      safelySetLoadingFlag('referrals', true);
      try {
        const rewardHistory = await listReferralRewards();
        if (!cancelled) {
          setReferrals(rewardHistory);
          safelySetDataError('referrals');
        }
      } catch (error) {
        console.error('Failed to load referral rewards:', error);
        safelySetDataError('referrals', toDataError(error, 'Could not load referral rewards.'));
      } finally {
        safelySetLoadingFlag('referrals', false);
      }
    }

    async function loadHostListings() {
      if (!user || !canLoadHostData) {
        setMyListings([]);
        safelySetDataError('hostListings');
        safelySetLoadingFlag('hostListings', false);
        return;
      }

      safelySetLoadingFlag('hostListings', true);
      try {
        const hostListings = await listHostListings(user.id);
        if (!cancelled) {
          setMyListings(hostListings);
          safelySetDataError('hostListings');
        }
      } catch (error) {
        console.error('Failed to load host listings:', error);
        safelySetDataError('hostListings', toDataError(error, 'Could not load host listings.'));
      } finally {
        safelySetLoadingFlag('hostListings', false);
      }
    }

    void loadPublicListings();
    void loadBookings();
    void loadReferrals();
    void loadHostListings();

    return () => {
      cancelled = true;
    };
  }, [canLoadHostData, profile?.isAdmin, profile?.role, reloadKey, setDataError, setLoadingFlag, user]);

  const reloadPlatformData = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const hasDataErrors = useMemo(() => Object.keys(dataErrors).length > 0, [dataErrors]);

  return {
    listings,
    myListings,
    myBookings,
    hostBookings,
    referrals,
    dataErrors,
    dataLoading,
    hasDataErrors,
    reloadPlatformData,
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
            console.warn('Failed to refresh listing availability after booking update:', error);
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
