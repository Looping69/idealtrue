export type WorkflowTestUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  photoUrl: string;
  role: 'guest' | 'host' | 'admin';
  hostPlan: 'standard' | 'professional' | 'premium';
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  balance: number;
  referralCount: number;
  tier: 'bronze' | 'silver' | 'gold';
  referralCode: string;
  referredByCode: string | null;
  paymentMethod: string | null;
  paymentInstructions: string | null;
  paymentReferencePrefix: string | null;
  createdAt: string;
  updatedAt: string;
  accountStatus?: 'active' | 'suspended' | 'deactivated';
  accountStatusReason?: string | null;
};

export function buildGuestUser(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return {
    id: 'guest-1',
    email: 'guest@example.com',
    emailVerified: true,
    displayName: 'Guest Example',
    photoUrl: '',
    role: 'guest',
    hostPlan: 'standard',
    kycStatus: 'verified',
    balance: 0,
    referralCount: 0,
    tier: 'bronze',
    referralCode: 'GUEST1',
    referredByCode: null,
    paymentMethod: null,
    paymentInstructions: null,
    paymentReferencePrefix: null,
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    accountStatus: 'active',
    accountStatusReason: null,
    ...overrides,
  };
}

export function buildHostUser(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return buildGuestUser({
    id: 'host-1',
    email: 'host@example.com',
    displayName: 'Host Example',
    role: 'host',
    hostPlan: 'professional',
    referralCode: 'HOST1',
    ...overrides,
  });
}

export function buildAdminUser(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return buildGuestUser({
    id: 'admin-1',
    email: 'admin@example.com',
    displayName: 'Admin Example',
    role: 'admin',
    hostPlan: 'premium',
    referralCode: 'ADMIN1',
    ...overrides,
  });
}

export function buildSuspendedUser(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return buildGuestUser({
    id: 'suspended-1',
    email: 'suspended@example.com',
    displayName: 'Suspended User',
    accountStatus: 'suspended',
    accountStatusReason: 'Compliance review is still open.',
    ...overrides,
  });
}

export function buildGreylistedHost(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return buildHostUser({
    id: 'greylisted-host-1',
    email: 'greylisted-host@example.com',
    displayName: 'Greylisted Host',
    ...overrides,
  });
}

export function buildKycPendingHost(overrides: Partial<WorkflowTestUser> = {}): WorkflowTestUser {
  return buildHostUser({
    id: 'kyc-pending-host-1',
    email: 'kyc-pending-host@example.com',
    displayName: 'KYC Pending Host',
    kycStatus: 'pending',
    ...overrides,
  });
}

export type WorkflowTestListing = {
  id: string;
  hostId: string;
  title: string;
  description: string;
  location: string;
  area: string;
  province: string;
  category: string;
  type: string;
  pricePerNight: number;
  discountPercent: number;
  adults: number;
  children: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  facilities: string[];
  restaurantOffers: string[];
  images: string[];
  videoUrl: string | null;
  isSelfCatering: boolean;
  hasRestaurant: boolean;
  isOccupied: boolean;
  latitude: number | null;
  longitude: number | null;
  blockedDates: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export function buildListing(overrides: Partial<WorkflowTestListing> = {}): WorkflowTestListing {
  return {
    id: 'listing-1',
    hostId: 'host-1',
    title: 'Sea Point Stay',
    description: 'Ocean-facing apartment',
    location: 'Cape Town',
    area: 'Sea Point',
    province: 'Western Cape',
    category: 'apartment',
    type: 'apartment',
    pricePerNight: 1800,
    discountPercent: 10,
    adults: 2,
    children: 1,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['wifi'],
    facilities: ['parking'],
    restaurantOffers: [],
    images: [],
    videoUrl: null,
    isSelfCatering: true,
    hasRestaurant: false,
    isOccupied: false,
    latitude: -33.9,
    longitude: 18.4,
    blockedDates: [],
    status: 'active',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

export type WorkflowTestBooking = {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalPrice: number;
  inquiryState: string;
  paymentState: string;
  paymentMethod: string | null;
  paymentInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  paymentReference?: string | null;
};

export function buildPendingBooking(overrides: Partial<WorkflowTestBooking> = {}): WorkflowTestBooking {
  return {
    id: 'booking-1',
    listingId: 'listing-1',
    guestId: 'guest-1',
    hostId: 'host-1',
    checkIn: '2026-04-10T00:00:00.000Z',
    checkOut: '2026-04-13T00:00:00.000Z',
    adults: 1,
    children: 0,
    totalPrice: 5445,
    inquiryState: 'PENDING',
    paymentState: 'UNPAID',
    paymentMethod: 'bank_transfer',
    paymentInstructions: 'Pay within 24 hours.',
    createdAt: '2026-04-01T10:05:00.000Z',
    updatedAt: '2026-04-01T10:05:00.000Z',
    paymentReference: null,
    ...overrides,
  };
}
