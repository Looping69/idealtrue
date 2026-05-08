import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Check, Loader2, Megaphone, ShieldCheck, Sparkles, Smartphone, Video, BarChart4, Users, Share2, LineChart, BadgeCheck } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from "@/contexts/AuthContext";
import { createSubscriptionCheckout, getCheckoutStatus, getMyHostBillingAccount, redeemHostVoucher } from "@/lib/billing-client";
import type { HostBillingAccount } from "@/types";

type PlanTier = 'standard' | 'professional' | 'premium';
type BillingInterval = 'monthly' | 'annual';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    id: PlanTier;
    name: string;
    price: string;
    description: string;
    features: PlanFeature[];
    highlight?: string;
    color: string;
    cta: string;
}

const plans: Plan[] = [
    {
        id: 'standard',
        name: "Standard",
        price: "R149",
        description: "A strong starting plan for hosts who want one polished listing with real visibility support.",
        highlight: "Most Popular",
        color: "bg-primary/10 border-blue-200",
        cta: "Start on Standard",
        features: [
            { text: "1 active listing", included: true },
            { text: "Stronger search placement", included: true },
            { text: "Up to 10 listing photos", included: true },
            { text: "Monthly social visibility support", included: true },
            { text: "Verified host badge", included: true },
            { text: "Placement in seasonal campaigns", included: true },
            { text: "Access to host promotions", included: true },
            { text: "Styled social content for your listing", included: true },
        ]
    },
    {
        id: 'professional',
        name: "Professional",
        price: "R350",
        description: "For hosts who want more reach, more promotion, and room to market multiple properties properly.",
        color: "bg-primary/10/50 border-blue-100",
        cta: "Go Professional",
        features: [
            { text: "Everything in Standard", included: true },
            { text: "Extra monthly social promos", included: true },
            { text: "Advanced performance insights", included: true },
            { text: "Custom marketing templates", included: true },
            { text: "Multiple active listings", included: true },
            { text: "Showcase video support", included: true },
            { text: "Featured Top Picks opportunities", included: false },
            { text: "Priority support", included: false },
            { text: "Multi-platform social copy", included: true },
        ]
    },
    {
        id: 'premium',
        name: "Premium",
        price: "R499",
        description: "Full promotion support for hosts who want premium placement, faster help, and the strongest visibility stack.",
        highlight: "Best Value",
        color: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200",
        cta: "Go Premium",
        features: [
            { text: "Everything in Standard", included: true },
            { text: "Showcase video placement", included: true },
            { text: "Priority social promo support", included: true },
            { text: "Featured Top Picks opportunities", included: true },
            { text: "Priority holiday traffic placement", included: true },
            { text: "Direct WhatsApp support", included: true },
            { text: "Custom marketing templates", included: true },
            { text: "Priority partner campaign access", included: true },
            { text: "Campaign-ready content across networks", included: true },
        ]
    }
];

const planStats = [
    { label: "No commission", value: "0%", icon: BadgeCheck },
    { label: "Facebook group network", value: "Nearly 1M", icon: Megaphone },
    { label: "Monthly community growth", value: "Thousands", icon: LineChart },
];

const comparisonRows = [
    { label: "Listings included", values: ["1", "Multiple", "Multiple"] },
    { label: "Verified host badge", values: ["Included", "Included", "Priority support handling"] },
    { label: "Video support", values: ["Not included", "Included", "Included"] },
    { label: "Social promotion", values: ["Monthly visibility", "Extra monthly promos", "Priority featured promo"] },
    { label: "Content engine", values: ["Listing-ready", "Multi-platform", "Campaign-ready"] },
    { label: "Insights", values: ["Basic", "Advanced", "Advanced"] },
    { label: "Support", values: ["Standard", "Priority", "WhatsApp direct"] },
];

export default function PricingPage({ onBack }: { onBack?: () => void }) {
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);
    const [fetchingPlan, setFetchingPlan] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<PlanTier>('standard');
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
    const [voucherCode, setVoucherCode] = useState('');
    const [redeemingVoucher, setRedeemingVoucher] = useState(false);
    const [billingAccount, setBillingAccount] = useState<HostBillingAccount | null>(null);
    const [searchParams] = useSearchParams();
    const sourceLabel = searchParams.get('source_label') || searchParams.get('region');
    const billingStatus = searchParams.get('billing_status');
    const checkoutId = searchParams.get('checkout_id');

    const fetchPlan = useCallback(async () => {
        if (!profile) {
            setCurrentPlan('standard');
            setBillingAccount(null);
            setFetchingPlan(false);
            return;
        }
        setCurrentPlan((profile.hostPlan as PlanTier) || 'standard');
        if (profile.role === 'host') {
            try {
                const account = await getMyHostBillingAccount();
                setBillingAccount(account);
            } catch (error) {
                console.error('Failed to load host billing account for pricing page:', error);
                setBillingAccount(null);
            }
        } else {
            setBillingAccount(null);
        }
        setFetchingPlan(false);
    }, [profile]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    useEffect(() => {
        if (!user || !billingStatus || !checkoutId) {
            return;
        }

        let cancelled = false;
        const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        async function resolveCheckout() {
            try {
                for (let attempt = 0; attempt < 8; attempt += 1) {
                    const result = await getCheckoutStatus(checkoutId);
                    if (cancelled) {
                        return;
                    }

                    if (result.status === 'paid') {
                        const nextProfile = await refreshProfile();
                        if (cancelled) {
                            return;
                        }
                        setCurrentPlan((nextProfile?.hostPlan as PlanTier) || currentPlan);
                        toast.success('Subscription payment confirmed. Your plan access is now live.');
                        navigate('/host', { replace: true });
                        return;
                    }

                    if (billingStatus === 'cancelled' || result.status === 'cancelled') {
                        toast.message('Checkout cancelled. No subscription changes were applied.');
                        return;
                    }

                    if (billingStatus === 'failed' || result.status === 'failed') {
                        toast.error('Payment failed. Nothing was upgraded.');
                        return;
                    }

                    if (attempt < 7) {
                        await wait(2000);
                    }
                }
                toast.message('Payment is still being confirmed. Give the webhook a moment and refresh if needed.');
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to resolve checkout status', error);
                }
            }
        }

        resolveCheckout();
        return () => {
            cancelled = true;
        };
    }, [billingStatus, checkoutId, currentPlan, navigate, refreshProfile, user]);


    const handleUpgrade = useCallback(async (planId: PlanTier) => {
        if (!user) {
            toast.error("Please sign in before choosing a paid host plan.");
            return;
        }

        const plan = plans.find(p => p.id === planId);
        if (!plan) return;

        setLoadingPlan(planId);

        try {
            const checkout = await createSubscriptionCheckout(planId, billingInterval);
            window.location.assign(checkout.redirectUrl);

        } catch (error: any) {
            console.error("Plan upgrade error:", error);
            toast.error("Upgrade failed: " + error.message);
        } finally {
            setLoadingPlan(null);
        }
    }, [billingInterval, user]);

    const handleVoucherRedeem = useCallback(async () => {
        if (!user) {
            toast.error("Please sign in before redeeming a voucher PIN.");
            return;
        }

        setRedeemingVoucher(true);
        try {
            const account = await redeemHostVoucher(voucherCode);
            setBillingAccount(account);
            const nextProfile = await refreshProfile();
            setCurrentPlan((nextProfile?.hostPlan as PlanTier) || account.plan);
            toast.success(`Voucher redeemed. Free Standard access now runs until ${account.currentPeriodEnd?.slice(0, 10)}.`);
            setVoucherCode('');
            navigate('/host', { replace: true });
        } catch (error: any) {
            console.error("Voucher redemption failed:", error);
            toast.error("Voucher redemption failed: " + error.message);
        } finally {
            setRedeemingVoucher(false);
        }
    }, [navigate, refreshProfile, user, voucherCode]);

    const hasActiveHostPlan = billingAccount?.billingSource === 'voucher' || billingAccount?.billingSource === 'paid';
    const showCurrentPlanState = profile?.role === 'host' && hasActiveHostPlan;

    const getPlanPrice = useCallback((plan: Plan) => {
        if (billingInterval === 'monthly') {
            return {
                display: plan.price,
                suffix: 'per month',
                helper: null as string | null,
            };
        }

        const monthlyAmount = parseInt(plan.price.replace('R', ''), 10);
        const annualAmount = monthlyAmount * 10;
        return {
            display: `R${annualAmount.toLocaleString()}`,
            suffix: 'per year',
            helper: monthlyAmount > 0 ? 'Annual billing includes a 2-month discount' : null,
        };
    }, [billingInterval]);

    if (fetchingPlan) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-10 pb-16">
            <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_32%),linear-gradient(135deg,#fffdf7_0%,#f8fbff_45%,#eef6ff_100%)] px-6 py-10 shadow-sm md:px-10 md:py-14">
                <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-amber-200/20 blur-3xl" />

                <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200">
                                Hosting Plans
                            </span>
                            <span className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">
                                Public Pricing
                            </span>
                        </div>

                        <div className="max-w-3xl space-y-4">
                            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                                Plans built to help hosts get seen, trusted, and booked across South Africa.
                            </h1>
                            <p className="max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
                                Choose the level of visibility and marketing support that fits your property business.
                                Every paid plan is designed to help your listing look stronger, reach more travellers, and convert more enquiries into bookings.
                            </p>
                            <p className="max-w-2xl text-base leading-7 text-slate-600">
                                Ideal Stay is backed by a Facebook group network with nearly one million members across location-based communities such as
                                <span className="font-semibold"> “Cape Town Holiday Accommodation”</span>,
                                <span className="font-semibold"> “Durban Holiday Accommodation”</span>,
                                <span className="font-semibold"> “Johannesburg Holiday Accommodation”</span>,
                                <span className="font-semibold"> “Pretoria Holiday Accommodation”</span>, and many more covering major cities and holiday towns across South Africa.
                                That network continues to grow by thousands of new members each month.
                            </p>
                        </div>

                        {sourceLabel && (
                            <div className="max-w-2xl rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900">
                                <div className="font-bold uppercase tracking-[0.2em] text-cyan-700">Campaign Source</div>
                                <p className="mt-2 leading-6">
                                    You came through the <span className="font-semibold">{sourceLabel}</span> acquisition path. We will keep that attribution intact while you evaluate plans and sign up.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {!user ? (
                                <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                                    Sign in to upgrade, but you can review every plan first.
                                </div>
                            ) : profile?.role === 'host' && !hasActiveHostPlan ? (
                                <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-800">
                                    Base host tier: Standard. Hosting billing only becomes active after voucher redemption or paid checkout.
                                </div>
                            ) : (
                                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                                    Your current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (onBack) {
                                        onBack();
                                        return;
                                    }
                                    navigate(profile?.role === 'host' ? '/host' : '/');
                                }}
                                className="rounded-full border-slate-300 bg-surface/80"
                            >
                                {profile?.role === 'host' ? 'Back to Host Workspace' : 'Back to Explore'}
                            </Button>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-surface/85 p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setBillingInterval('monthly')}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${billingInterval === 'monthly' ? 'bg-[#08a8c8] text-white' : 'text-slate-600 hover:text-slate-950'}`}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingInterval('annual')}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${billingInterval === 'annual' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-950'}`}
                            >
                                Annual
                            </button>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                Annual discount
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        {planStats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-surface/70 bg-surface/80 p-5 backdrop-blur-sm shadow-sm">
                                <stat.icon className="mb-3 h-5 w-5 text-cyan-700" />
                                <div className="text-3xl font-black text-slate-950">{stat.value}</div>
                                <div className="mt-1 text-sm font-medium text-slate-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 rounded-[2rem] border border-emerald-200 bg-[linear-gradient(135deg,#f0fdf4_0%,#ecfeff_55%,#f8fafc_100%)] p-6 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                        Founding Host Voucher
                    </div>
                    <h2 className="text-2xl font-black text-slate-950">First 100 hosts can redeem a 1-month Standard voucher PIN.</h2>
                    <p className="text-sm leading-6 text-slate-600">
                        Newly verified hosts in that first 100 are emailed a personal voucher PIN. Redeeming it starts a free 1-month Standard plan. No upfront card capture is required, and reminder notices only start 7 days before the free period ends.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={voucherCode}
                        onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                        placeholder="Enter voucher PIN"
                        className="h-12 min-w-[220px] rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold tracking-[0.2em] text-slate-900 outline-none focus:border-emerald-500"
                    />
                    <Button onClick={handleVoucherRedeem} disabled={redeemingVoucher || !voucherCode.trim()} className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
                        {redeemingVoucher ? 'Redeeming...' : 'Redeem Voucher'}
                    </Button>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {plans.map((plan) => {
                    const isCurrent = showCurrentPlanState && currentPlan === plan.id;
                    const isLoading = loadingPlan === plan.id;
                    const price = getPlanPrice(plan);

                    return (
                        <Card
                            key={plan.id}
                            className={`relative flex h-full flex-col overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${plan.color} ${isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : 'border-slate-200'}`}
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600" />
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-[#08a8c8] text-white px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold">
                                        {plan.highlight}
                                    </span>
                                </div>
                            )}

                            <CardHeader className="pb-4 text-left">
                                <div className="mb-4 flex items-center justify-between">
                                    <span />
                                    {isCurrent && (
                                        <span className="border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-950">{plan.name}</CardTitle>
                                <div className="mt-4 flex items-end gap-2">
                                    <span className="text-5xl font-black tracking-tight text-slate-950">{price.display}</span>
                                    <span className="pb-1 text-sm font-semibold uppercase tracking-wider text-slate-500">{price.suffix}</span>
                                </div>
                                {price.helper && (
                                    <div className="pt-2 text-sm font-semibold text-emerald-700">{price.helper}</div>
                                )}
                                <CardDescription className="pt-3 text-left leading-6 text-slate-600">
                                    {plan.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <ul className="mt-4 space-y-3">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm">
                                            {feature.included ? (
                                                <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                                            ) : (
                                                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                                </div>
                                            )}
                                            <span className={feature.included ? 'font-medium text-slate-700' : 'text-slate-400'}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={loadingPlan !== null || isCurrent}
                                    variant={isCurrent ? "outline" : plan.id === 'premium' || plan.id === 'professional' ? "default" : "secondary"}
                                    className={`h-12 w-full rounded-xl text-base font-semibold ${plan.id === 'premium' ? 'bg-[#08a8c8] hover:bg-[#08a8c8]/90 text-white' : plan.id === 'professional' ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : ''
                                        }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isCurrent ? (
                                        "Current Plan"
                                    ) : (
                                        <span className="inline-flex items-center gap-2">
                                            {plan.cta}
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#164e63_45%,#0f766e_100%)] p-8 text-white shadow-xl md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-surface/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-surface/20 bg-surface/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                        <Users className="w-4 h-4" />
                        <span>Nearly 1 Million Group Members</span>
                    </div>
                    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-5">
                            <h3 className="text-3xl font-black leading-tight md:text-4xl">
                                Put your listing in front of one of South Africa's strongest holiday accommodation audiences.
                            </h3>
                            <p className="text-lg leading-8 text-cyan-50/90">
                                Our network spans city and town Facebook groups built around the familiar
                                <span className="font-semibold"> “(Town Name) Holiday Accommodation”</span> format.
                                It already reaches travellers across places like Cape Town, Durban, Johannesburg, Pretoria, Margate, Umhlanga, St Lucia, Port Edward and more, and continues to add thousands of new members every month.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-surface/15 bg-surface/10 p-5 backdrop-blur-md">
                                <Share2 className="mb-3 h-8 w-8 text-cyan-100" />
                                <div className="text-lg font-bold">Real Audience Reach</div>
                                <p className="mt-1 text-sm text-cyan-50/80">Your listing can be positioned in front of a large, travel-focused Facebook audience.</p>
                            </div>
                            <div className="rounded-2xl border border-surface/15 bg-surface/10 p-5 backdrop-blur-md">
                                <ShieldCheck className="mb-3 h-8 w-8 text-cyan-100" />
                                <div className="text-lg font-bold">More Trust</div>
                                <p className="mt-1 text-sm text-cyan-50/80">Badges, stronger presentation, and better placement help guests feel safer enquiring.</p>
                            </div>
                            <div className="rounded-2xl border border-surface/15 bg-surface/10 p-5 backdrop-blur-md">
                                <Video className="mb-3 h-8 w-8 text-cyan-100" />
                                <div className="text-lg font-bold">Content Support</div>
                                <p className="mt-1 text-sm text-cyan-50/80">Turn any listing into styled posts for Facebook, Instagram, X, LinkedIn, and more.</p>
                            </div>
                            <div className="rounded-2xl border border-surface/15 bg-surface/10 p-5 backdrop-blur-md">
                                <Smartphone className="mb-3 h-8 w-8 text-cyan-100" />
                                <div className="text-lg font-bold">Faster Support</div>
                                <p className="mt-1 text-sm text-cyan-50/80">Get quicker help when your listing, promotion, or account needs attention.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-surface p-8 shadow-sm md:p-10">
                <div className="mb-8 max-w-2xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        <BarChart4 className="h-4 w-4" />
                        Compare What Changes
                    </div>
                    <h3 className="text-3xl font-black text-slate-950">A clear view of what each plan includes.</h3>
                    <p className="mt-3 text-base leading-7 text-slate-600">
                        Compare listing capacity, promotion support, visibility tools, and support levels side by side before you choose a plan.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-4 bg-[#08a8c8] text-white">
                        <div className="px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Feature</div>
                        {plans.map((plan) => (
                            <div key={plan.id} className="px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.2em]">
                                {plan.name}
                            </div>
                        ))}
                    </div>

                    {comparisonRows.map((row, rowIndex) => (
                        <div key={row.label} className={`grid grid-cols-4 ${rowIndex % 2 === 0 ? 'bg-surface' : 'bg-slate-50'}`}>
                            <div className="px-4 py-4 text-sm font-semibold text-slate-700">{row.label}</div>
                            {row.values.map((value, valueIndex) => (
                                <div key={`${row.label}-${valueIndex}`} className="px-4 py-4 text-center text-sm text-slate-600">
                                    {value}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#fff7ed_55%,#fff1f2_100%)] p-8 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-surface/80 px-3 py-1 text-sm font-medium text-amber-800">
                        <Sparkles className="h-4 w-4" />
                        Included Growth Service
                    </div>
                    <h3 className="text-3xl font-black text-slate-950">Every paid host plan includes the content engine.</h3>
                    <p className="text-base leading-7 text-slate-700">
                        Turn any Ideal Stay listing into polished promotional content without having to start from a blank page every time you want to post.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-surface/80 bg-surface/90 p-5 shadow-sm">
                        <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Input</div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            Choose one of your listings and let the engine pull the title, location, amenities, price, and positioning automatically.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-surface/80 bg-surface/90 p-5 shadow-sm">
                        <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Styling</div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            Generate styled copy with headlines, body text, call-to-action wording, and hashtag direction for each platform.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-surface/80 bg-surface/90 p-5 shadow-sm">
                        <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Output</div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            Reuse the content on Facebook, Instagram, X, LinkedIn, or wherever else you market your property.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-surface/80 bg-surface/90 p-5 shadow-sm">
                        <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Commercial Angle</div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">
                            Save time, stay consistent, and keep your listing visible more often without hiring a full content team.
                    </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
