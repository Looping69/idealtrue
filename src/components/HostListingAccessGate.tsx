import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, Lock, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMyHostBillingAccount } from '@/lib/billing-client';
import { getMyListingQuota } from '@/lib/platform-client';
import { getErrorMessage } from '@/lib/errors';
import { useEffectiveKycStatus } from '@/hooks/use-effective-kyc-status';
import type { HostBillingAccount, Listing, UserProfile } from '@/types';

type ListingQuota = Awaited<ReturnType<typeof getMyListingQuota>>;

type HostListingAccessGateProps = {
  children: ReactElement;
  listings: Listing[];
  profile: UserProfile | null;
};

function GateShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactElement;
  title: string;
  description: string;
  children?: ReactElement | ReactElement[];
}) {
  return (
    <div className="mx-auto max-w-2xl py-20 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container-low">
        {icon}
      </div>
      <h1 className="text-3xl font-bold text-on-surface">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-on-surface-variant">{description}</p>
      {children ? <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div> : null}
    </div>
  );
}

function InlineWarning({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 rounded-3xl border border-warning/30 bg-surface-container-low p-4 text-left text-on-surface shadow-[0_10px_30px_rgba(18,28,42,0.08)]">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HostListingAccessGate({ children, listings, profile }: HostListingAccessGateProps) {
  const navigate = useNavigate();
  const { effectiveKycStatus } = useEffectiveKycStatus(profile);
  const [quota, setQuota] = useState<ListingQuota | null>(null);
  const [billingAccount, setBillingAccount] = useState<HostBillingAccount | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [billingWarning, setBillingWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fallbackUsedListings = useMemo(
    () => listings.filter((listing) => listing.status !== 'archived').length,
    [listings],
  );

  const loadAccessState = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setQuotaError(null);
    setBillingWarning(null);

    const [quotaResult, billingResult] = await Promise.allSettled([
      getMyListingQuota(),
      getMyHostBillingAccount(),
    ]);

    if (quotaResult.status === 'fulfilled') {
      setQuota(quotaResult.value);
    } else {
      setQuota(null);
      setQuotaError(getErrorMessage(quotaResult.reason));
    }

    if (billingResult.status === 'fulfilled') {
      setBillingAccount(billingResult.value);
    } else {
      setBillingAccount(null);
      setBillingWarning(getErrorMessage(billingResult.reason));
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    void loadAccessState();
  }, [loadAccessState]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-outline-variant" />
      </div>
    );
  }

  if (!profile) {
    return (
      <GateShell
        icon={<Lock className="h-10 w-10 text-outline-variant" />}
        title="Sign in required"
        description="You need to be signed in as a host before creating a listing."
      >
        <Button onClick={() => navigate('/signup?role=host')} className="h-12 rounded-xl px-8 text-base font-bold">
          Sign in as host
        </Button>
      </GateShell>
    );
  }

  if (effectiveKycStatus !== 'verified') {
    const description =
      effectiveKycStatus === 'pending'
        ? "Your identity verification is still under review. Listing access unlocks once verification is approved."
        : effectiveKycStatus === 'rejected'
          ? "Your last verification attempt was rejected. Please resubmit clearer documents before creating a listing."
          : "Hosts need verified identity documents before creating a listing.";

    return (
      <GateShell
        icon={<ShieldAlert className="h-10 w-10 text-primary" />}
        title="Verification required"
        description={description}
      >
        <Button onClick={() => navigate('/account')} className="h-12 rounded-xl px-8 text-base font-bold">
          Open account verification
        </Button>
        <Button onClick={() => navigate('/host')} variant="ghost" className="h-12 rounded-xl px-8 text-base font-bold">
          Return to dashboard
        </Button>
      </GateShell>
    );
  }

  if (quotaError) {
    return (
      <GateShell
        icon={<AlertTriangle className="h-10 w-10 text-warning" />}
        title="Could not verify listing access"
        description={`The listing quota check failed: ${quotaError}`}
      >
        <Button onClick={() => void loadAccessState()} className="h-12 rounded-xl px-8 text-base font-bold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry access check
        </Button>
        <Button onClick={() => navigate('/host/listings')} variant="ghost" className="h-12 rounded-xl px-8 text-base font-bold">
          Go to listings
        </Button>
      </GateShell>
    );
  }

  if (billingAccount?.billingStatus === 'greylisted') {
    return (
      <GateShell
        icon={<CreditCard className="h-10 w-10 text-destructive" />}
        title="Billing action required"
        description={billingAccount.greylistReason || 'Your host account is currently greylisted. Resolve billing before creating another listing.'}
      >
        <Button onClick={() => navigate('/pricing?audience=host')} className="h-12 rounded-xl px-8 text-base font-bold">
          Resolve billing
        </Button>
        <Button onClick={() => navigate('/host')} variant="ghost" className="h-12 rounded-xl px-8 text-base font-bold">
          Return to dashboard
        </Button>
      </GateShell>
    );
  }

  if (quota && !quota.canCreate) {
    const maxListings = quota.maxListings ?? 'unlimited';
    return (
      <GateShell
        icon={<Lock className="h-10 w-10 text-outline-variant" />}
        title="Listing limit reached"
        description={`Your ${quota.plan} plan currently allows ${maxListings} non-archived listing${maxListings === 1 ? '' : 's'}. You are using ${quota.usedListings}.`}
      >
        <Button onClick={() => navigate('/pricing?audience=host')} className="h-12 rounded-xl px-8 text-base font-bold">
          Upgrade my plan
        </Button>
        <Button onClick={() => navigate('/host/listings')} variant="ghost" className="h-12 rounded-xl px-8 text-base font-bold">
          Manage listings
        </Button>
      </GateShell>
    );
  }

  return (
    <div>
      {billingWarning ? (
        <InlineWarning
          title="Billing status could not be checked"
          description={`You can continue, but listing submission may still be blocked by billing rules. Details: ${billingWarning}`}
        />
      ) : null}
      {quota ? (
        <div className="mb-6 rounded-3xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div>
              <strong className="text-on-surface">Listing access checked.</strong>{' '}
              Plan: {quota.plan}. Used listings: {quota.usedListings}{quota.maxListings === null ? '' : `/${quota.maxListings}`}.
            </div>
          </div>
        </div>
      ) : fallbackUsedListings > 0 ? (
        <InlineWarning
          title="Using local listing count"
          description={`The server quota check did not return a quota, so the page is showing your current local listing count: ${fallbackUsedListings}.`}
        />
      ) : null}
      {children}
    </div>
  );
}
