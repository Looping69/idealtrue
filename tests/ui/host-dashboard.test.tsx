import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HostDashboard from '@/pages/HostDashboard';
import type { Booking, HostBillingAccount, Listing, UserProfile } from '@/types';

const getMyHostBillingAccountMock = vi.fn();
const startBillingPaymentMock = vi.fn();
const mockUseBookingOpsSummaries = vi.fn();

vi.mock('@/hooks/use-booking-ops-summaries', () => ({
  useBookingOpsSummaries: (...args: unknown[]) => mockUseBookingOpsSummaries(...args),
}));

vi.mock('@/lib/billing-client', () => ({
  getCheckoutStatus: vi.fn(),
  getMyHostBillingAccount: (...args: unknown[]) => getMyHostBillingAccountMock(...args),
  startBillingPayment: (...args: unknown[]) => startBillingPaymentMock(...args),
}));

vi.mock('@/lib/platform-client', () => ({
  updateBookingStatus: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}));

const profile: UserProfile = {
  id: 'host-1',
  displayName: 'Host Example',
  email: 'host@example.com',
  photoUrl: '',
  role: 'host',
  referralCode: 'HOST-1',
  accountStatus: 'active',
  balance: 0,
  referralCount: 0,
  tier: 'bronze',
  hostPlan: 'professional',
  kycStatus: 'verified',
  createdAt: '2026-04-20T08:00:00.000Z',
};

const listing: Listing = {
  id: 'listing-1',
  hostId: 'host-1',
  title: 'Sea Point Stay',
  description: 'Ocean-facing apartment',
  location: 'Cape Town',
  area: 'Sea Point',
  province: 'Western Cape',
  type: 'apartment',
  pricePerNight: 1800,
  discount: 0,
  images: ['https://example.com/listing.jpg'],
  videoUrl: null,
  amenities: ['wifi'],
  facilities: ['parking'],
  otherFacility: '',
  adults: 2,
  children: 0,
  bedrooms: 1,
  bathrooms: 1,
  isSelfCatering: true,
  hasRestaurant: false,
  restaurantOffers: [],
  isOccupied: false,
  rating: 4.8,
  reviews: 12,
  category: 'apartment',
  status: 'active',
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
};

function makeBooking(
  id: string,
  inquiryState: Booking['inquiryState'],
  overrides: Partial<Booking> = {},
): Booking {
  return {
    id,
    listingId: listing.id,
    guestId: `guest-${id}`,
    hostId: profile.id,
    checkIn: '2026-05-01',
    checkOut: '2026-05-03',
    totalPrice: 3600,
    breakageDeposit: 500,
    guests: {
      adults: 2,
      children: 0,
    },
    inquiryState,
    paymentState: inquiryState === 'APPROVED' ? 'INITIATED' : 'UNPAID',
    createdAt: '2026-04-20T08:00:00.000Z',
    viewedAt: inquiryState === 'VIEWED' || inquiryState === 'RESPONDED' ? '2026-04-20T09:00:00.000Z' : null,
    respondedAt: inquiryState === 'RESPONDED' ? '2026-04-20T10:00:00.000Z' : null,
    paymentUnlockedAt: inquiryState === 'APPROVED' ? '2026-04-20T11:00:00.000Z' : null,
    paymentSubmittedAt: null,
    paymentConfirmedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

describe('HostDashboard', () => {
  beforeEach(() => {
    startBillingPaymentMock.mockReset();
    mockUseBookingOpsSummaries.mockReset();
    mockUseBookingOpsSummaries.mockReturnValue({});
    const billingAccount: HostBillingAccount = {
      userId: profile.id,
      plan: 'professional',
      billingSource: 'paid',
      billingStatus: 'active',
      reminderCount: 0,
      cardOnFile: true,
      cardLabel: 'Visa ending in 4242',
      inReminderWindow: false,
      greylistEligible: false,
      nextAction: 'none',
      currentPeriodStart: '2026-04-01',
      currentPeriodEnd: '2026-05-01',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z',
    };

    getMyHostBillingAccountMock.mockResolvedValue(billingAccount);
  });

  it('shows the full needs-response queue size instead of the preview slice', async () => {
    const bookings = [
      makeBooking('booking-1', 'PENDING'),
      makeBooking('booking-2', 'VIEWED'),
      makeBooking('booking-3', 'RESPONDED'),
      makeBooking('booking-4', 'PENDING'),
      makeBooking('booking-5', 'APPROVED'),
    ];

    render(
      <MemoryRouter>
        <HostDashboard
          profile={profile}
          listings={[listing]}
          bookings={bookings}
          onUpgrade={vi.fn()}
          onChat={vi.fn()}
          onBookingUpdated={vi.fn()}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getMyHostBillingAccountMock).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: 'Needs Response' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByLabelText('4 new items in Needs Response')).toBeInTheDocument();
  });

  it('shows approved holds in the watchlist with separate payment-state cues', async () => {
    const now = Date.now();
    const bookings = [
      makeBooking('payment-open', 'APPROVED', {
        expiresAt: new Date(now + 20 * 60 * 60 * 1000).toISOString(),
      }),
      makeBooking('payment-review', 'APPROVED', {
        paymentSubmittedAt: '2026-04-21T10:00:00.000Z',
        paymentReference: 'IDEAL-123',
        expiresAt: new Date(now + 5 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    render(
      <MemoryRouter>
        <HostDashboard
          profile={profile}
          listings={[listing]}
          bookings={bookings}
          onUpgrade={vi.fn()}
          onChat={vi.fn()}
          onBookingUpdated={vi.fn()}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getMyHostBillingAccountMock).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: 'Approved Hold Watchlist' })).toBeInTheDocument();
    expect(screen.getAllByText('Sea Point Stay').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Payment due/i)).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText(/Nearest deadline:/)).toBeInTheDocument();
    expect(screen.getByText(/(payment confirmation|guest payment) closes/i)).toBeInTheDocument();
  });

  it('prefers backend ops summary data in the approved-hold watchlist when available', async () => {
    const bookings = [
      makeBooking('payment-open', 'APPROVED', {
        expiresAt: '2026-04-22T18:00:00.000Z',
      }),
    ];

    mockUseBookingOpsSummaries.mockReturnValue({
      'payment-open': {
        inquiryId: 'payment-open',
        lastActor: 'support',
        lastEvent: 'DISPUTE_OPENED',
        lastEventAt: '2026-04-21T09:30:00.000Z',
        activeDeadlineKind: 'GUEST_PAYMENT',
        activeDeadlineAt: '2099-04-22T18:00:00.000Z',
        openDisputeCount: 2,
      },
    });

    render(
      <MemoryRouter>
        <HostDashboard
          profile={profile}
          listings={[listing]}
          bookings={bookings}
          onUpgrade={vi.fn()}
          onChat={vi.fn()}
          onBookingUpdated={vi.fn()}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getMyHostBillingAccountMock).toHaveBeenCalled());

    expect(screen.getByText('Disputes 2')).toBeInTheDocument();
    expect(screen.getByText(/Payment due/i)).toBeInTheDocument();
    expect(screen.getByText(/Nearest deadline:/)).toBeInTheDocument();
    expect(screen.getByText(/guest payment closes/i)).toBeInTheDocument();
  });

  it('starts the Yoco-backed billing setup payment link instead of showing a dead manual card path', async () => {
    const user = userEvent.setup();
    startBillingPaymentMock.mockResolvedValue({
      paymentId: 'payment-intent-host-card-setup',
      provider: 'yoco',
      providerOrderId: 'order-host-card-setup',
      redirectUrl: 'https://pay.example.com/host-card-setup',
      providerMode: 'test',
      status: 'pending',
    });
    getMyHostBillingAccountMock.mockResolvedValue({
      userId: profile.id,
      plan: 'standard',
      billingSource: 'voucher',
      billingStatus: 'active',
      voucherCode: 'HOST-ABC123XYZ9',
      voucherRedeemedAt: '2026-04-20T08:00:00.000Z',
      currentPeriodStart: '2026-04-20T08:00:00.000Z',
      currentPeriodEnd: '2026-07-20T08:00:00.000Z',
      reminderWindowStartsAt: '2026-07-13T08:00:00.000Z',
      lastReminderSentAt: null,
      reminderCount: 0,
      cardOnFile: false,
      cardLabel: null,
      inReminderWindow: true,
      greylistEligible: false,
      nextAction: 'add_card',
      createdAt: '2026-04-20T08:00:00.000Z',
      updatedAt: '2026-04-20T08:00:00.000Z',
    });

    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: assignMock },
    });

    render(
      <MemoryRouter>
        <HostDashboard
          profile={profile}
          listings={[listing]}
          bookings={[]}
          onUpgrade={vi.fn()}
          onChat={vi.fn()}
          onBookingUpdated={vi.fn()}
        />
      </MemoryRouter>,
    );

    await waitFor(() => expect(getMyHostBillingAccountMock).toHaveBeenCalled());

    expect(screen.getByText(/Yoco billing setup payment link/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set Up Billing Card' }));

    expect(startBillingPaymentMock).toHaveBeenCalledTimes(1);
    expect(startBillingPaymentMock).toHaveBeenCalledWith({ purpose: 'host_billing_setup' });
    expect(assignMock).toHaveBeenCalledWith('https://pay.example.com/host-card-setup');
  });
});
