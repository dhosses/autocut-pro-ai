import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-lg mb-3">
            <span className="text-2xl">✂️</span>
            <span className="text-white">AutoCut <span className="text-sky-400">Pro AI</span></span>
          </div>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            AI-powered video editing for Adobe Premiere Pro. Trim silence, sync cameras,
            generate subtitles — automatically.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Product</div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Account</div>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/signup" className="hover:text-white transition-colors">Sign up free</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} AutoCut Pro AI. All rights reserved.</p>
        <p className="text-xs text-gray-600">Made for creators.</p>
      </div>
    </footer>
  );
}
