"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LEMONSQUEEZY_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL || "";

export default function CheckoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        // Not logged in — go to signup then redirect back to pricing
        router.push("/signup?next=/pricing");
        return;
      }

      const userId = data.session.user.id;
      const email = data.session.user.email ?? "";

      if (!LEMONSQUEEZY_CHECKOUT_URL) {
        alert("Checkout not configured yet — add NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL to your .env");
        return;
      }

      // Pass user ID so the webhook can match the purchase to the account
      const url = new URL(LEMONSQUEEZY_CHECKOUT_URL);
      url.searchParams.set("checkout[custom][user_id]", userId);
      url.searchParams.set("checkout[email]", email);
      url.searchParams.set("checkout[redirect_url]", `${window.location.origin}/download?subscribed=1`);

      window.location.href = url.toString();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="block w-full text-center py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 disabled:opacity-60 text-white transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 hover:-translate-y-0.5"
    >
      {loading ? "Loading…" : "Upgrade to Pro →"}
    </button>
  );
}
