import type { ListingStatus } from "../shared/domain";

export type HostPlanTier = "standard" | "professional" | "premium";

export interface HostListingQuota {
  plan: HostPlanTier;
  maxListings: number | null;
  usedListings: number;
  canCreate: boolean;
}

function getMaxListingsForPlan(plan: HostPlanTier) {
  return plan === "standard" ? 1 : null;
}

export function countsTowardHostListingQuota(status: ListingStatus) {
  return status !== "archived" && status !== "draft";
}

export function computeHostListingQuota(plan: HostPlanTier, usedListings: number): HostListingQuota {
  const maxListings = getMaxListingsForPlan(plan);
  return {
    plan,
    maxListings,
    usedListings,
    canCreate: maxListings === null || usedListings < maxListings,
  };
}
