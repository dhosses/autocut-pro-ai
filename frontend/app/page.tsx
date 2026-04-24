import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          AutoCut <span className="text-brand-500">Pro AI</span>
        </h1>
        <p className="text-xl text-gray-400">
          AI-powered video editing for creators. Trim silence, sync cameras,
          track subjects, and generate subtitles — automatically.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign in
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          {[
            { icon: "✂️", label: "Silence Trimming" },
            { icon: "🎙️", label: "Auto Subtitles" },
            { icon: "📹", label: "Camera Switching" },
            { icon: "👤", label: "Subject Tracking" },
          ].map((f) => (
            <div key={f.label} className="bg-gray-900 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="text-sm text-gray-300">{f.label}</div>
            </div>
          ))}
        </div>

        <section className="pt-12 space-y-6">
          <h2 className="text-2xl font-semibold">Simple pricing</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="bg-gray-900 rounded-xl p-6 space-y-2">
              <div className="text-lg font-semibold">Free</div>
              <div className="text-3xl font-bold">$0</div>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>30 minutes/month</li>
                <li>All features included</li>
                <li>Export FCPXML + SRT</li>
              </ul>
              <Link href="/signup" className="block mt-4 text-center py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                Start free
              </Link>
            </div>
            <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-6 space-y-2">
              <div className="text-lg font-semibold">Pro</div>
              <div className="text-3xl font-bold">$19<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>Unlimited minutes</li>
                <li>Priority processing</li>
                <li>All export formats</li>
              </ul>
              <Link href="/signup" className="block mt-4 text-center py-2 bg-brand-500 rounded-lg text-sm hover:bg-brand-600 transition-colors text-white">
                Get Pro
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
