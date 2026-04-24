"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface Subscription {
  tier: "free" | "pro";
  minutes_used: number;
  minutes_limit: number;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  const usePct = sub ? Math.min(100, (sub.minutes_used / sub.minutes_limit) * 100) : 0;
  const overQuota = sub?.tier === "free" && sub.minutes_used >= sub.minutes_limit;

  return (
    <main className="min-h-screen p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AutoCut Pro AI</h1>
        <button onClick={signOut} className="text-gray-400 hover:text-white text-sm transition-colors">Sign out</button>
      </header>

      {sub && (
        <div className="bg-gray-900 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">
              {sub.tier === "pro" ? "Pro plan — unlimited" : `${sub.minutes_used} / ${sub.minutes_limit} min used`}
            </span>
            <span className={`font-medium capitalize ${sub.tier === "pro" ? "text-brand-500" : "text-gray-300"}`}>
              {sub.tier}
            </span>
          </div>
          {sub.tier === "free" && (
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${usePct}%` }} />
            </div>
          )}
          {overQuota && (
            <div className="text-amber-400 text-sm">
              Free quota reached.{" "}
              <a href="#upgrade" className="underline">Upgrade to Pro</a> for unlimited processing.
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
