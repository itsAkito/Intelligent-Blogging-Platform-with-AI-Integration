"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features?: string[];
}

interface CurrentSubscription {
  plan_id?: string;
  subscription_plans?: SubscriptionPlan | null;
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedTier, setSelectedTier] = useState(1); // Default to Professional
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const selectedPlanParam = searchParams.get("plan")?.toLowerCase() || "professional";

  useEffect(() => {
    if (selectedPlanParam.includes("contributor")) {
      setSelectedTier(0);
      return;
    }
    if (selectedPlanParam.includes("leader") || selectedPlanParam.includes("elite")) {
      setSelectedTier(2);
      return;
    }
    setSelectedTier(1);
  }, [selectedPlanParam]);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        const plansRes = await fetch("/api/subscriptions?plansOnly=true", {
          credentials: "include",
        });

        if (plansRes.ok) {
          const data = await plansRes.json();
          if (isMounted) {
            setPlans(data.plans || []);
          }
        }

        if (isAuthenticated) {
          const currentRes = await fetch("/api/subscriptions", {
            credentials: "include",
          });

          if (currentRes.ok) {
            const data = await currentRes.json();
            if (isMounted) {
              setCurrentSubscription(data.subscription || null);
            }
          }
        } else if (isMounted) {
          setCurrentSubscription(null);
        }
      } catch (error) {
        if (isMounted) {
          setActionError(error instanceof Error ? error.message : "Unable to load plans right now.");
        }
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const tiers = useMemo(() => [
    {
      id: 0,
      planName: "Contributor",
      name: "The Contributor",
      description: "Perfect for starting the digital narrative.",
      price: "$0",
      annualPrice: "$0",
      period: "/MO",
      features: [
        "Basic AI assistance",
        "3 posts per month",
        "Community access",
      ],
      cta: "START FREE",
      popular: false,
      successHref: "/editor",
    },
    {
      id: 1,
      planName: "Professional",
      name: "The Professional",
      description: "For serious writers building a lasting brand.",
      price: "$29",
      annualPrice: "$261",
      period: "/MO",
      badge: "BEST FOR YOU",
      features: [
        "Advanced AI editing tools",
        "Unlimited monthly posts",
        "Career tracking insights",
        "Real-time analytics dashboard",
      ],
      cta: "GET PRO ACCESS",
      popular: true,
      successHref: "/dashboard",
    },
    {
      id: 2,
      planName: "Elite",
      name: "The Thought Leader",
      description: "The ultimate ecosystem for industry authorities.",
      price: "$89",
      annualPrice: "$801",
      period: "/MO",
      features: [
        "Priority AI generation queue",
        "Custom SEO strategy engine",
        "1-1 mentor sessions",
        "Full API developer access",
      ],
      cta: "GO ELITE",
      popular: false,
      successHref: "/inner-circle/join",
    },
  ], []);

  const tiersWithPlanIds = useMemo(() => (
    tiers.map((tier) => {
      const matchedPlan = plans.find((plan) => plan.name.toLowerCase() === tier.planName.toLowerCase());
      return {
        ...tier,
        planId: matchedPlan?.id,
        price: matchedPlan ? `$${matchedPlan.price_monthly}` : tier.price,
        annualPrice: matchedPlan ? `$${matchedPlan.price_annual}` : tier.annualPrice,
        features: matchedPlan?.features?.length ? matchedPlan.features : tier.features,
      };
    })
  ), [plans, tiers]);

  const handlePlanAction = async (tierId: number) => {
    const tier = tiersWithPlanIds.find((item) => item.id === tierId);

    if (!tier) {
      return;
    }

    setSelectedTier(tierId);
    setActionError("");

    if (!isAuthenticated) {
      const targetPlan = tier.planName.toLowerCase();
      router.push(`/auth?next=${encodeURIComponent(`/pricing?plan=${targetPlan}`)}`);
      return;
    }

    if (tier.planName === "Contributor") {
      router.push(tier.successHref);
      return;
    }

    if (!tier.planId) {
      setActionError("Subscription plans are not available yet. Please run the latest database migrations.");
      return;
    }

    if (currentSubscription?.plan_id === tier.planId) {
      router.push(tier.successHref);
      return;
    }

    try {
      setActionLoading(tierId);
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: tier.planId,
          billingCycle: isAnnual ? "annual" : "monthly",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update subscription.");
      }

      setCurrentSubscription(data);
      router.push(tier.successHref);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update subscription.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-blue-400 mb-4">
            THE FUTURE OF CONTENT
          </p>
          <h1 className="text-6xl sm:text-7xl font-bold font-headline tracking-tighter mb-6">
            <span className="text-white">Elevate Your </span>
            <span className="bg-linear-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Narrative Authority
            </span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join a new generation of digital architects leveraging artificial intelligence to craft premium editorial experiences.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-6 mb-16">
            <span className={`text-sm font-medium ${!isAnnual ? "text-white" : "text-zinc-400"}`}>
              MONTHLY
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-16 h-8 rounded-full transition-colors ${
                isAnnual ? "bg-blue-600" : "bg-zinc-700"
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAnnual ? "translate-x-9" : "translate-x-1"
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isAnnual ? "text-white" : "text-zinc-400"}`}>
                ANNUAL
              </span>
              {isAnnual && (
                <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  30% OFF
                </span>
              )}
            </div>
          </div>

          {actionError && (
            <p className="mx-auto max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {actionError}
            </p>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {tiersWithPlanIds.map((tier) => {
            const isCurrentPlan = currentSubscription?.plan_id === tier.planId;
            const displayPrice = isAnnual ? tier.annualPrice : tier.price;
            const displayPeriod = isAnnual ? "/YR" : tier.period;

            return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer group border-2 ${
                selectedTier === tier.id || tier.popular
                  ? "md:scale-105 border-blue-500 bg-linear-to-br from-blue-950/40 via-background to-background shadow-2xl shadow-blue-500/20"
                  : "border-zinc-700 bg-zinc-900/20 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full border border-blue-400">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Selection Indicator */}
              {selectedTier === tier.id && !tier.badge && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full border border-blue-400">
                    SELECTED
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-white mb-2 font-headline">{tier.name}</h3>
                <p className="text-sm text-zinc-400 mb-8">{tier.description}</p>

                {/* Price */}
                <div className="mb-8 pb-8 border-b border-zinc-700/50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white font-headline">{displayPrice}</span>
                    <span className="text-zinc-400 text-sm">{displayPeriod}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handlePlanAction(tier.id);
                  }}
                  disabled={actionLoading === tier.id}
                  className={`w-full mb-8 font-bold py-6 text-sm font-headline rounded-lg transition-all uppercase tracking-wider ${
                    selectedTier === tier.id || tier.popular
                      ? "bg-linear-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50"
                      : "bg-zinc-700 text-white hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {actionLoading === tier.id
                    ? "PROCESSING..."
                    : isCurrentPlan
                    ? "OPEN PLAN"
                    : tier.cta}
                </Button>

                {/* Features List */}
                <div className="space-y-4">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedTier === tier.id || tier.popular ? "bg-blue-500/30 border border-blue-400" : "border border-zinc-600"
                      }`}>
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Compare Capabilities */}
      <div className="px-4 sm:px-6 lg:px-8 py-20 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16 font-headline">
            Compare Capabilities
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-4 px-4 font-bold text-white text-xs uppercase tracking-wider">
                    CATEGORY
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-white text-xs uppercase tracking-wider">
                    CONTRIBUTOR
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-blue-400 text-xs uppercase tracking-wider">
                    PROFESSIONAL
                  </th>
                  <th className="text-center py-4 px-4 font-bold text-white text-xs uppercase tracking-wider">
                    LEADER
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "CONTENT PRODUCTION", c: "3 swirling", p: "Unlimited", l: "Unlimited" },
                  { label: "MEDIA STORAGE", c: "1GB", p: "5GB", l: "Enterprise" },
                  { label: "AI CODE ENGINE", c: "Standard", p: "Advanced", l: "Ultra-Priority" },
                  { label: "SEMANTIC SEO", c: false, p: true, l: true },
                  { label: "CAREER DASHBOARD", c: false, p: true, l: true },
                  { label: "REVENUE TOOLS", c: "—", p: "2% Fee", l: "5% Fee" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                    <td className="py-4 px-4 font-semibold text-zinc-300">{row.label}</td>
                    <td className="py-4 px-4 text-center text-zinc-400">
                      {typeof row.c === "boolean" ? (
                        row.c ? (
                          <div className="flex justify-center">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        row.c
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-zinc-100">
                      {typeof row.p === "boolean" ? (
                        row.p ? (
                          <div className="flex justify-center">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        row.p
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-zinc-400">
                      {typeof row.l === "boolean" ? (
                        row.l ? (
                          <div className="flex justify-center">
                            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )
                      ) : (
                        row.l
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16 font-headline">
            Frequently Asked
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I switch plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes are reflected immediately in your dashboard and next billing cycle.",
              },
              {
                q: 'What is "Narrative Authority"?',
                a: "It's our proprietary metric for measuring how much influence your AI-assisted content is getting within your specific niche or industry.",
              },
              {
                q: "How does the 14-day trial work?",
                a: "New customers can explore the full range of Professional features for 14 days. No credit card is required to start your journey.",
              },
              {
                q: "Is the AI content uniquely mine?",
                a: "Absolutely. All content generated via Aiblog's AI is 100% owned by you. We do not claim rights to your narrative or creative output.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-6 cursor-pointer hover:border-zinc-600 transition-colors group"
              >
                <summary className="font-bold text-white flex items-center justify-between">
                  {item.q}
                  <span className="ml-4 text-blue-400 group-open:rotate-180 transition-transform">
                    ↓
                  </span>
                </summary>
                <p className="text-zinc-400 mt-4">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-20 bg-linear-to-b from-zinc-900/50 to-background border-t border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6 font-headline">
            The next era of editorial starts with you.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              type="button"
              onClick={() => void handlePlanAction(selectedTier)}
              className="px-8 py-6 text-base font-bold bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 uppercase tracking-wider font-headline"
            >
              {actionLoading === selectedTier ? "PROCESSING..." : "START YOUR 14-DAY FREE TRIAL"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="px-8 py-6 text-base font-bold border-zinc-600 text-white rounded-lg hover:bg-zinc-800/50 uppercase tracking-wider font-headline"
            >
              <Link href="/contact">SPEAK TO EDITORIAL TEAM</Link>
            </Button>
          </div>
          <p className="text-sm text-zinc-500 mt-6">
            NO CREDIT CARD REQUIRED · INSTANT ACTIVATION
          </p>
        </div>
      </div>
    </div>
  );
}
