"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface Subscription {
  tier: "free" | "basic" | "pro";
  minutes_used: number;
  minutes_limit: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      const userId = data.session.user.id;

      Promise.all([
        supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("tier, minutes_used, minutes_limit").eq("user_id", userId).single(),
      ]).then(([{ data: projects }, { data: sub }]) => {
        setProjects(projects || []);
        setSub(sub as Subscription);
        setLoading(false);
      });
    });
  }, [router]);

  async function createProject() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;
    const { data } = await supabase.from("projects").insert({
      user_id: session.session.user.id,
      name: `Project ${new Date().toLocaleDateString()}`,
    }).select().single();
    if (data) router.push(`/project/${data.id}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function manageBilling() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    const res = await fetch(`${API_URL}/subscription/portal`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const json = await res.json();
    if (json.url) window.location.href = json.url;
    else alert("Could not open billing portal. Please try again.");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const isUnlimited = sub?.tier === "pro" || sub?.minutes_limit === null;
  const usePct = sub && !isUnlimited && sub.minutes_limit
    ? Math.min(100, (sub.minutes_used / sub.minutes_limit) * 100)
    : 0;
  const overQuota = sub?.tier === "free" && sub.minutes_limit !== null && sub.minutes_used >= (sub.minutes_limit ?? 30);

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AutoCut Pro AI</h1>
        <button onClick={signOut} className="text-gray-400 hover:text-white text-sm transition-colors">Sign out</button>
      </header>

      {sub && (
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">
              {isUnlimited
                ? `${sub.tier === "pro" ? "Pro" : "Basic"} plan — unlimited`
                : `${sub.minutes_used} / ${sub.minutes_limit} min used`}
            </span>
            <div className="flex items-center gap-3">
              <span className={`font-medium capitalize ${sub.tier !== "free" ? "text-sky-400" : "text-gray-300"}`}>
                {sub.tier}
              </span>
              {sub.tier !== "free" && (
                <button
                  onClick={manageBilling}
                  className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                >
                  Manage billing
                </button>
              )}
            </div>
          </div>
          {!isUnlimited && (
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${usePct}%` }} />
            </div>
          )}
          {overQuota && (
            <div className="text-amber-400 text-sm">
              Free quota reached.{" "}
              <Link href="/pricing" className="underline">Upgrade</Link> for more processing.
            </div>
          )}
          {sub.tier === "free" && !overQuota && (
            <div className="text-gray-500 text-xs">
              <Link href="/pricing" className="text-sky-500 hover:text-sky-400">Upgrade to Basic or Pro</Link> to download the Premiere Pro installer.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <button
          onClick={createProject}
          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className="bg-gray-900 hover:bg-gray-800 rounded-xl p-5 transition-colors"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-gray-500 text-sm mt-1">
                {new Date(p.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
