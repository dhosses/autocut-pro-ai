"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const PRICES = {
  basic: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || "",
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "",
  },
};

function Check() {
  return (
    <svg className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function Dash() {
  return <span className="text-gray-700 flex-shrink-0 mt-0.5 w-4 text-center">—</span>;
}

interface PlanButtonProps {
  tier: "basic" | "pro";
  billing: "monthly" | "yearly";
  label: string;
}

function PlanButton({ tier, billing, label }: PlanButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/signup?next=/pricing");
        return;
      }

      const priceId = PRICES[tier][billing];
      if (!priceId) {
        alert("Payment not configured yet — add Stripe price IDs to your .env");
        return;
      }

      const res = await fetch(`${API_URL}/subscription/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const json = await res.json();
      if (!res.ok) { alert(json.error || "Failed to start checkout"); return; }
      window.location.href = json.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
        tier === "pro"
          ? "bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-0.5"
          : "bg-white/10 hover:bg-white/15 border border-white/10 text-white"
      }`}
    >
      {loading ? "Loading…" : label}
    </button>
  );
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Try it out. No credit card required.",
    color: "text-gray-400",
    features: [
      { label: "30 minutes / month", included: true },
      { label: "Silence trimming", included: true },
      { label: "AI subtitles (Whisper)", included: true },
      { label: "Multi-camera sync", included: true },
      { label: "Subject tracking", included: true },
      { label: "FCPXML + SRT export", included: true },
      { label: "MP4 export", included: false },
      { label: "Premiere Pro installer download", included: false },
      { label: "Priority processing", included: false },
      { label: "Early feature access", included: false },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 9,
    yearlyPrice: 79,
    description: "For regular editors who need the extension.",
    color: "text-sky-400",
    features: [
      { label: "200 minutes / month", included: true },
      { label: "Silence trimming", included: true },
      { label: "AI subtitles (Whisper)", included: true },
      { label: "Multi-camera sync", included: true },
      { label: "Subject tracking", included: true },
      { label: "FCPXML + SRT export", included: true },
      { label: "MP4 export", included: true },
      { label: "Premiere Pro installer download", included: true },
      { label: "Priority processing", included: false },
      { label: "Early feature access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 19,
    yearlyPrice: 159,
    description: "Unlimited everything for power editors.",
    color: "text-violet-400",
    badge: "Most popular",
    features: [
      { label: "Unlimited processing", included: true },
      { label: "Silence trimming", included: true },
      { label: "AI subtitles (Whisper)", included: true },
      { label: "Multi-camera sync", included: true },
      { label: "Subject tracking", included: true },
      { label: "FCPXML + SRT export", included: true },
      { label: "MP4 export", included: true },
      { label: "Premiere Pro installer download", included: true },
      { label: "Priority processing", included: true },
      { label: "Early feature access", included: true },
    ],
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="bg-black text-white min-h-screen">
      <Nav />

      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sky-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold">Simple pricing</h1>
          <p className="text-gray-400 text-xl">
            Start free. No credit card required. Upgrade when you need more.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                billing === "yearly"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs font-bold text-emerald-400">
                Save ~30%
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isPro = plan.id === "pro";
            const isBasic = plan.id === "basic";
            const isFree = plan.id === "free";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col gap-6 rounded-2xl p-8 ${
                  isPro
                    ? "bg-gradient-to-b from-sky-500/10 to-violet-500/10 border border-sky-500/25"
                    : "bg-white/3 border border-white/8"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full text-xs font-bold text-white whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.color}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-5xl font-bold">${price}</span>
                    {price > 0 && (
                      <span className="text-gray-400 text-lg">
                        /{billing === "monthly" ? "mo" : "yr"}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>

                {isFree ? (
                  <Link
                    href="/signup"
                    className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-white/8 hover:bg-white/15 border border-white/10 text-white transition-colors"
                  >
                    Get started free
                  </Link>
                ) : (
                  <PlanButton
                    tier={plan.id as "basic" | "pro"}
                    billing={billing}
                    label={`Get ${plan.name} →`}
                  />
                )}

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                      {f.included ? <Check /> : <Dash />}
                      <span className={f.included ? "text-gray-300" : "text-gray-600"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-600 mt-8">
          All plans include the Premiere Pro panel. Cancel any time from your account.
        </p>
      </section>

      <section className="py-16 px-6 border-t border-white/5 text-center">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="text-3xl">🔒</div>
          <h3 className="text-xl font-bold">Cancel any time</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            No long-term contracts. Cancel from your dashboard at any time —
            you keep access until the end of your current billing period.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
