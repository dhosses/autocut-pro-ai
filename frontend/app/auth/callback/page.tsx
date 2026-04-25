"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      // Exchange PKCE code if present
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?error=auth_failed");
        return;
      }

      // Send to download if already subscribed, otherwise pricing
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("tier")
        .eq("user_id", session.user.id)
        .single();

      if (sub?.tier === "basic" || sub?.tier === "pro") {
        router.push("/download");
      } else {
        router.push("/pricing");
      }
    };
    handle();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  );
}
