"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MAX_POLLS = 20;

type State = "loading" | "pending" | "subscribed";

function DownloadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "1";

  const [state, setState] = useState<State>("loading");
  const [downloading, setDownloading] = useState<"mac-arm64" | "mac-intel" | "windows" | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/login?next=/download"); return; }
      setState("subscribed");

      // Subscription gate — uncomment to re-enable
      // supabase.from("subscriptions").select("tier").eq("user_id", data.session.user.id).single().then(({ data: sub }) => {
      //   const tier = sub?.tier as string | undefined;
      //   if (tier === "pro" || tier === "basic") { setState("subscribed"); }
      //   else if (justSubscribed) { setState("pending"); }
      //   else { router.push("/pricing"); }
      // });
    });
  }, []);


  async function handleDownload(platform: "mac-arm64" | "mac-intel" | "windows") {
    setDownloading(platform);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { router.push("/login?next=/download"); return; }

      const res = await fetch(`${API_URL}/download/${platform}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403) { router.push("/pricing"); return; }
        if (res.status === 503) {
          alert("This installer is not yet available. Check back soon.");
          return;
        }
        alert(err.error || "Download failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = platform === "mac-arm64"
        ? "AutoCut Pro AI Installer (Apple Silicon).dmg"
        : platform === "mac-intel"
        ? "AutoCut Pro AI Installer (Intel).dmg"
        : "AutoCut Pro AI Installer.exe";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <div>
          <h2 className="text-xl font-semibold mb-2">Confirming your subscription…</h2>
          <p className="text-gray-500 text-sm">This usually takes a few seconds. Hang tight.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-sky-500/30">
          ✂️
        </div>
        <h1 className="text-2xl font-bold">AutoCut Pro AI</h1>
        <p className="text-gray-400 text-sm">Download the installer for your operating system.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">macOS</p>

        <button
          onClick={() => handleDownload("mac-arm64")}
          disabled={!!downloading}
          className="w-full flex items-center gap-4 p-5 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-xl transition-colors disabled:opacity-60 text-left group"
        >
          <span className="text-3xl">🍎</span>
          <div className="flex-1">
            <div className="font-semibold">Apple Silicon</div>
            <div className="text-sm text-gray-500">M1 / M2 / M3 / M4 · .dmg</div>
          </div>
          <span className="text-sky-400 text-sm font-medium group-hover:text-sky-300 transition-colors">
            {downloading === "mac-arm64" ? "Downloading…" : "Download →"}
          </span>
        </button>

        <button
          onClick={() => handleDownload("mac-intel")}
          disabled={!!downloading}
          className="w-full flex items-center gap-4 p-5 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-xl transition-colors disabled:opacity-60 text-left group"
        >
          <span className="text-3xl">🍎</span>
          <div className="flex-1">
            <div className="font-semibold">Intel Mac</div>
            <div className="text-sm text-gray-500">Intel Core i5 / i7 / i9 · .dmg</div>
          </div>
          <span className="text-sky-400 text-sm font-medium group-hover:text-sky-300 transition-colors">
            {downloading === "mac-intel" ? "Downloading…" : "Download →"}
          </span>
        </button>

        <p className="text-xs text-gray-600 uppercase tracking-widest font-medium pt-2">Windows</p>

        <button
          onClick={() => handleDownload("windows")}
          disabled={!!downloading}
          className="w-full flex items-center gap-4 p-5 bg-gray-900 hover:bg-gray-800 border border-white/10 rounded-xl transition-colors disabled:opacity-60 text-left group"
        >
          <span className="text-3xl">🪟</span>
          <div className="flex-1">
            <div className="font-semibold">Windows</div>
            <div className="text-sm text-gray-500">Windows 10/11 x64 · .exe</div>
          </div>
          <span className="text-sky-400 text-sm font-medium group-hover:text-sky-300 transition-colors">
            {downloading === "windows" ? "Downloading…" : "Download →"}
          </span>
        </button>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-3">
        <h3 className="font-medium text-sm">After downloading</h3>
        <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
          <li><strong className="text-gray-200">macOS:</strong> Open the .dmg and run the installer</li>
          <li><strong className="text-gray-200">Windows:</strong> Run the .exe and follow the wizard</li>
          <li>Open (or restart) Adobe Premiere Pro</li>
          <li>Go to <strong className="text-gray-200">Window → Extensions → AutoCut Pro AI</strong></li>
        </ol>
      </div>

      <p className="text-center text-xs text-gray-600">
        Need help?{" "}
        <Link href="mailto:support@autocutproai.com" className="text-sky-500 hover:text-sky-400">
          Contact support
        </Link>
      </p>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative">
        <Suspense>
          <DownloadContent />
        </Suspense>
      </div>
    </div>
  );
}
