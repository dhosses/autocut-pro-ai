import Link from "next/link";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";
import CheckoutButton from "@/components/marketing/checkout-button";

const FREE_FEATURES = [
  "30 minutes of processing/month",
  "Silence trimming",
  "AI subtitle generation",
  "Multi-camera sync",
  "Subject tracking",
  "FCPXML export (Premiere Pro)",
  "SRT subtitle export",
  "Premiere Pro panel included",
];

const PRO_FEATURES = [
  "Unlimited processing minutes",
  "Priority queue",
  "Silence trimming",
  "AI subtitle generation",
  "Multi-camera sync",
  "Subject tracking",
  "FCPXML + SRT + MP4 export",
  "Premiere Pro panel included",
  "Early access to new features",
];

export default function PricingPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Nav />

      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sky-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Simple pricing</h1>
          <p className="text-gray-400 text-xl">
            Start free. No credit card required. Upgrade when you need unlimited.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">

          {/* Free */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-8 flex flex-col gap-6">
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold">$0</span>
              </div>
              <p className="text-gray-500 text-sm">Forever free. 30 min/month.</p>
            </div>

            <Link href="/signup"
              className="block text-center py-3 rounded-xl font-semibold text-sm bg-white/8 hover:bg-white/15 border border-white/10 text-white transition-colors">
              Get started free
            </Link>

            <ul className="space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-sky-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-b from-sky-500/10 to-violet-500/10 border border-sky-500/25 rounded-2xl p-8 flex flex-col gap-6">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full text-xs font-bold text-white whitespace-nowrap">
              Most popular
            </div>

            <div>
              <div className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-bold">$19</span>
                <span className="text-gray-400 text-lg">/month</span>
              </div>
              <p className="text-gray-500 text-sm">Billed monthly. Cancel any time.</p>
            </div>

            <CheckoutButton />

            <ul className="space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-sky-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Full comparison</h2>
          <div className="border border-white/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-white/3 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center text-sky-400">Pro</div>
            </div>
            {[
              ["Processing minutes", "30 / month", "Unlimited"],
              ["Silence trimming", "✓", "✓"],
              ["AI subtitles (Whisper)", "✓", "✓"],
              ["Multi-camera sync", "✓", "✓"],
              ["Subject tracking", "✓", "✓"],
              ["FCPXML export", "✓", "✓"],
              ["SRT export", "✓", "✓"],
              ["MP4 export", "—", "✓"],
              ["Priority processing", "—", "✓"],
              ["Premiere Pro panel", "✓", "✓"],
              ["Early feature access", "—", "✓"],
            ].map(([feature, free, pro], i) => (
              <div key={i} className={`grid grid-cols-3 px-6 py-3.5 text-sm border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}>
                <div className="text-gray-300">{feature}</div>
                <div className={`text-center ${free === "—" ? "text-gray-600" : "text-gray-300"}`}>{free}</div>
                <div className={`text-center font-medium ${pro === "—" ? "text-gray-600" : "text-sky-400"}`}>{pro}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-16 px-6 border-t border-white/5 text-center">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="text-3xl">🔒</div>
          <h3 className="text-xl font-bold">Cancel any time</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            No long-term contracts. Cancel your Pro subscription at any time from your account —
            you keep access until the end of your current billing period.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
