"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(next);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <Link href="/" className="text-2xl font-bold tracking-tight inline-block mb-2">
          ✂️ AutoCut <span className="text-sky-400">Pro AI</span>
        </Link>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-gray-500 text-sm">30 minutes free every month. No card needed.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-sky-500 focus:bg-white/8 transition-colors"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-sky-500 focus:bg-white/8 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20"
        >
          {loading ? "Creating account…" : "Create free account"}
        </button>
        <p className="text-center text-xs text-gray-600">
          By signing up you agree to our terms of service.
        </p>
      </form>

      <p className="text-center text-gray-500 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-violet-500/8 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
