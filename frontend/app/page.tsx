import Link from "next/link";
import Nav from "@/components/marketing/nav";
import Footer from "@/components/marketing/footer";

const FEATURES = [
  {
    icon: "✂️",
    title: "Silence Trimming",
    desc: "Automatically detects and removes pauses, dead air, and filler from your footage. Save hours of manual scrubbing.",
  },
  {
    icon: "💬",
    title: "Auto Subtitles",
    desc: "Whisper AI transcribes your audio with near-human accuracy. Export SRT or burn subtitles directly into your video.",
  },
  {
    icon: "🎙️",
    title: "Multi-Cam Sync",
    desc: "Align multiple camera angles using audio waveform matching. No clapperboard needed.",
  },
  {
    icon: "👤",
    title: "Subject Tracking",
    desc: "Detects faces and auto-crops your footage to keep the subject centred — perfect for vertical video.",
  },
];

const STEPS = [
  { n: "01", title: "Upload your footage", desc: "Drag and drop your video and audio clips into the dashboard or send them directly from the Premiere Pro panel." },
  { n: "02", title: "Choose what to automate", desc: "Pick any combination — silence trim, subtitles, camera sync, or subject tracking. Run them all at once." },
  { n: "03", title: "Apply to your timeline", desc: "Results land directly in Premiere Pro. Cuts made, captions added, file imported — ready to fine-tune." },
];

const FAQS = [
  { q: "Do I need Adobe Premiere Pro?", a: "Yes — AutoCut Pro AI is built specifically for Premiere Pro 2022 and later. Results are applied directly to your timeline via our panel extension." },
  { q: "What video formats are supported?", a: "MP4, MOV, AVI, MKV and most other common formats. Audio files (MP3, WAV, M4A) are supported for sync and subtitle jobs." },
  { q: "How accurate is the silence detection?", a: "Highly accurate. You control the silence threshold (dB) and minimum duration, so you decide what counts as 'silence' for your content type." },
  { q: "Can I cancel my subscription?", a: "Yes, any time. Cancel from your account — you keep Pro access until the end of your billing period." },
  { q: "Is my footage stored on your servers?", a: "Clips are uploaded for processing and stored temporarily in private encrypted storage. They are never used for training or shared with third parties." },
];

export default function LandingPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-violet-500/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now with Premiere Pro panel — apply edits directly to your timeline
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">
            Edit faster with{" "}
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              AI that works
            </span>
            <br />inside Premiere
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            AutoCut Pro AI trims silence, generates subtitles, syncs cameras, and tracks subjects —
            all from a panel inside Adobe Premiere Pro.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5">
              Start for free →
            </Link>
            <Link href="/pricing"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl text-lg transition-colors">
              See pricing
            </Link>
          </div>

          <p className="text-sm text-gray-600">Free plan includes 30 minutes/month. No credit card required.</p>
        </div>

        {/* Fake UI preview */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border border-white/10 bg-gray-950 overflow-hidden shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-gray-600 font-mono">AutoCut Pro AI — Project Dashboard</span>
            </div>
            <div className="p-6 grid md:grid-cols-3 gap-4">
              {["Trim Silence", "Generate Subtitles", "Sync Cameras"].map((label, i) => (
                <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">{label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      i === 0 ? "bg-green-500/20 text-green-400" :
                      i === 1 ? "bg-sky-500/20 text-sky-400 animate-pulse" :
                      "bg-gray-500/20 text-gray-500"
                    }`}>{i === 0 ? "Done" : i === 1 ? "Processing…" : "Queued"}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all ${
                      i === 0 ? "w-full" : i === 1 ? "w-2/3" : "w-0"
                    }`} />
                  </div>
                  <p className="text-xs text-gray-600">{i === 0 ? "2m 14s saved" : i === 1 ? "Transcribing audio…" : "Waiting"}</p>
                </div>
              ))}
              <div className="md:col-span-3 bg-white/3 border border-white/5 rounded-xl p-4">
                <div className="text-xs text-gray-600 mb-2">Timeline</div>
                <div className="h-8 bg-white/5 rounded-lg overflow-hidden flex gap-0.5 p-1">
                  {[40, 8, 25, 5, 15, 4, 20, 6, 30].map((w, i) => (
                    <div key={i} className={`h-full rounded-sm flex-none transition-all ${
                      i % 2 === 1 ? "bg-white/10" : "bg-gradient-to-r from-sky-500/70 to-violet-500/70"
                    }`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { n: "10×", label: "Faster editing" },
            { n: "30 min", label: "Free every month" },
            { n: "100%", label: "Private & secure" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">{s.n}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything in one panel</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">Four powerful tools. One click each. Applied directly to your Premiere Pro timeline.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-white/3 hover:bg-white/5 border border-white/8 hover:border-white/15 rounded-2xl p-7 transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-gray-400 text-lg">From raw footage to polished edit in three steps.</p>
          </div>
          <div className="space-y-6">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-lg">
                  {s.n}
                </div>
                <div className="pt-3">
                  <h3 className="text-xl font-semibold mb-1">{s.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-gray-400 text-lg">Start free. Upgrade when you need more.</p>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-5">
          <PricingCard
            name="Free"
            price="$0"
            per=""
            desc="Perfect for trying it out"
            features={["30 minutes/month", "All 4 features", "FCPXML + SRT export", "Premiere Pro panel"]}
            cta="Get started free"
            href="/signup"
            highlight={false}
          />
          <PricingCard
            name="Pro"
            price="$19"
            per="/month"
            desc="For serious creators"
            features={["Unlimited minutes", "Priority processing", "All export formats", "Early access to new features"]}
            cta="Start Pro"
            href="/pricing"
            highlight={true}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-6">
          <Link href="/pricing" className="text-sky-400 hover:underline">See full pricing details →</Link>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group bg-white/3 border border-white/8 rounded-xl overflow-hidden">
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer list-none font-medium text-gray-200 hover:text-white transition-colors">
                  {faq.q}
                  <span className="text-gray-500 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-5 text-gray-400 leading-relaxed text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to edit faster?</h2>
          <p className="text-gray-400 text-lg">Join creators who are saving hours every week with AutoCut Pro AI.</p>
          <Link href="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5">
            Start for free →
          </Link>
          <p className="text-sm text-gray-600">No credit card required. 30 minutes free every month.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PricingCard({ name, price, per, desc, features, cta, href, highlight }: {
  name: string; price: string; per: string; desc: string;
  features: string[]; cta: string; href: string; highlight: boolean;
}) {
  return (
    <div className={`rounded-2xl p-7 flex flex-col gap-5 ${
      highlight
        ? "bg-gradient-to-b from-sky-500/10 to-violet-500/10 border border-sky-500/30 relative"
        : "bg-white/3 border border-white/8"
    }`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-sky-500 to-violet-500 rounded-full text-xs font-semibold text-white">
          Most popular
        </div>
      )}
      <div>
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-500">{per}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-sky-400 font-bold">✓</span>{f}
          </li>
        ))}
      </ul>
      <Link href={href}
        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
          highlight
            ? "bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 text-white shadow-lg shadow-sky-500/20"
            : "bg-white/8 hover:bg-white/15 text-white border border-white/10"
        }`}>
        {cta}
      </Link>
    </div>
  );
}
