import { HostPlan } from "../shared/domain";

export type ContentEntitlementLimits = {
  includedDraftsPerMonth: number;
  canSchedule: boolean;
  contentStudioEnabled: boolean;
};

export type ContentEntitlementSnapshot = {
  contentStudioEnabled: boolean;
  remainingIncludedDrafts: number;
  creditBalance: number;
};

export type ContentDebitDecision =
  | { allowed: true; source: "included" | "credit" }
  | { allowed: false; reason: "studio_disabled" | "insufficient_credits" };

export const CONTENT_LIMITS: Record<HostPlan, ContentEntitlementLimits> = {
  standard: { includedDraftsPerMonth: 20, canSchedule: false, contentStudioEnabled: true },
  professional: { includedDraftsPerMonth: 60, canSchedule: true, contentStudioEnabled: true },
  premium: { includedDraftsPerMonth: 120, canSchedule: true, contentStudioEnabled: true },
};

export function getContentCreditPrice(credits: number) {
  if (![10, 25, 50].includes(credits)) {
    return null;
  }

  return credits * 12;
}

export function resolveContentDraftDebit(entitlements: ContentEntitlementSnapshot): ContentDebitDecision {
  if (!entitlements.contentStudioEnabled) {
    return { allowed: false, reason: "studio_disabled" };
  }

  if (entitlements.remainingIncludedDrafts > 0) {
    return { allowed: true, source: "included" };
  }

  if (entitlements.creditBalance > 0) {
    return { allowed: true, source: "credit" };
  }

  return { allowed: false, reason: "insufficient_credits" };
}
