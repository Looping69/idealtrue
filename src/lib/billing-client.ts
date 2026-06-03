import { encoreRequest } from './encore-client';
import type { Listing } from '@/types';
import type { SocialPlatform, SocialTemplateId, SocialTone } from './social-content';
import type { AdminHostBillingAccount, HostBillingAccount } from '@/types';

export type HostPlan = 'standard' | 'professional' | 'premium';
export type BillingInterval = 'monthly' | 'annual';

export interface ContentEntitlements {
  plan: HostPlan;
  contentStudioEnabled: boolean;
  includedDraftsPerMonth: number;
  usedDraftsThisMonth: number;
  remainingIncludedDrafts: number;
  creditBalance: number;
  canSchedule: boolean;
}

export interface ContentDraft {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  platform: SocialPlatform;
  tone: SocialTone;
  templateId: SocialTemplateId;
  templateName: string;
  status: 'draft' | 'scheduled' | 'published';
  content: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLinkSession {
  sessionId: string;
  paymentLinkId: string;
  orderId: string;
  redirectUrl: string;
  providerMode: 'live' | 'test';
}

export type BillingPaymentPurpose = 'subscription' | 'content_credits' | 'host_billing_setup';

export interface BillingPayment {
  paymentId: string;
  provider: 'yoco';
  providerMode: 'live' | 'test';
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  redirectUrl: string;
  providerOrderId: string;
}

export async function startBillingPayment(params:
  | { purpose: 'subscription'; plan: HostPlan; billingInterval: BillingInterval }
  | { purpose: 'content_credits'; credits: number }
  | { purpose: 'host_billing_setup' }
) {
  return encoreRequest<BillingPayment>(
    '/billing/payments',
    {
      method: 'POST',
      body: JSON.stringify(params),
    },
    { auth: true },
  );
}

export async function createSubscriptionCheckout(plan: HostPlan, billingInterval: BillingInterval) {
  return encoreRequest<{ checkoutId: string; redirectUrl: string }>(
    '/billing/subscriptions/checkout',
    {
      method: 'POST',
      body: JSON.stringify({ plan, billingInterval }),
    },
    { auth: true },
  );
}

export async function createSubscriptionPaymentLink(plan: HostPlan, billingInterval: BillingInterval) {
  return encoreRequest<PaymentLinkSession>(
    '/billing/subscriptions/payment-link',
    {
      method: 'POST',
      body: JSON.stringify({ plan, billingInterval }),
    },
    { auth: true },
  );
}

export async function createHostBillingSetupCheckout() {
  return encoreRequest<{ checkoutId: string; redirectUrl: string }>(
    '/billing/host/setup-checkout',
    {
      method: 'POST',
    },
    { auth: true },
  );
}

export async function createHostBillingSetupPaymentLink() {
  return encoreRequest<PaymentLinkSession>(
    '/billing/host/setup-payment-link',
    {
      method: 'POST',
    },
    { auth: true },
  );
}

export async function getContentEntitlements() {
  const response = await encoreRequest<{ entitlements: ContentEntitlements }>(
    '/billing/content/entitlements',
    {},
    { auth: true },
  );
  return response.entitlements;
}

export async function createContentCreditsCheckout(credits: number) {
  return encoreRequest<{ checkoutId: string; redirectUrl: string }>(
    '/billing/content/credits/checkout',
    {
      method: 'POST',
      body: JSON.stringify({ credits }),
    },
    { auth: true },
  );
}

export async function createContentCreditsPaymentLink(credits: number) {
  return encoreRequest<PaymentLinkSession>(
    '/billing/content/credits/payment-link',
    {
      method: 'POST',
      body: JSON.stringify({ credits }),
    },
    { auth: true },
  );
}

export async function generateContentDraft(
  listing: Listing,
  platform: SocialPlatform,
  tone: SocialTone,
  templateId: SocialTemplateId,
  options?: {
    includePrice?: boolean;
    includeSpecialOffer?: boolean;
    customHeadline?: string;
  },
) {
  const response = await encoreRequest<{ draft: ContentDraft; entitlements: ContentEntitlements }>(
    '/billing/content/drafts/generate',
    {
      method: 'POST',
      body: JSON.stringify({
        listingId: listing.id,
        platform,
        tone,
        templateId,
        includePrice: options?.includePrice ?? true,
        includeSpecialOffer: options?.includeSpecialOffer ?? false,
        customHeadline: options?.customHeadline ?? '',
      }),
    },
    { auth: true },
  );
  return response;
}

export async function listContentDrafts() {
  const response = await encoreRequest<{ drafts: ContentDraft[] }>(
    '/billing/content/drafts',
    {},
    { auth: true },
  );
  return response.drafts;
}

export async function updateContentDraft(params: {
  draftId: string;
  content?: string;
  status?: ContentDraft['status'];
  scheduledFor?: string | null;
}) {
  const response = await encoreRequest<{ draft: ContentDraft }>(
    `/billing/content/drafts/${encodeURIComponent(params.draftId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(params),
    },
    { auth: true },
  );
  return response.draft;
}

export async function getCheckoutStatus(checkoutId: string) {
  return encoreRequest<{ status: 'pending' | 'paid' | 'failed' | 'cancelled'; checkoutType: 'subscription' | 'content_credits' | 'host_billing_setup' }>(
    `/billing/checkouts/${encodeURIComponent(checkoutId)}`,
    {},
    { auth: true },
  );
}

export async function getPaymentLinkStatus(sessionId: string) {
  return encoreRequest<{ status: 'pending' | 'paid' | 'failed' | 'cancelled'; sessionType: 'subscription' | 'content_credits' | 'host_billing_setup' }>(
    `/billing/payment-links/${encodeURIComponent(sessionId)}`,
    {},
    { auth: true },
  );
}

export async function getBillingPaymentStatus(paymentId: string) {
  return encoreRequest<{ status: 'pending' | 'paid' | 'failed' | 'cancelled'; purpose: BillingPaymentPurpose; providerMode: 'live' | 'test' }>(
    `/billing/payments/${encodeURIComponent(paymentId)}`,
    {},
    { auth: true },
  );
}

export async function getMyHostBillingAccount() {
  const response = await encoreRequest<{ account: HostBillingAccount }>(
    '/billing/host/account',
    {},
    { auth: true },
  );
  return response.account;
}

export async function redeemHostVoucher(code: string) {
  const response = await encoreRequest<{ account: HostBillingAccount }>(
    '/billing/host/vouchers/redeem',
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    },
    { auth: true },
  );
  return response.account;
}

export async function listAdminHostBillingAccounts() {
  const response = await encoreRequest<{ accounts: AdminHostBillingAccount[] }>(
    '/admin/billing/host-accounts',
    {},
    { auth: true },
  );
  return response.accounts;
}
