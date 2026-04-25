import { Router } from "express";
import Stripe from "stripe";
import { supabase } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { FEATURE_FLAGS, type Tier } from "../config/features";

const router = Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" as any });
}

// POST /subscription/checkout — create Stripe Checkout session
router.post("/checkout", requireAuth, async (req: AuthRequest, res: any) => {
  const { priceId } = req.body as { priceId: string };
  // if (!priceId) { res.status(400).json({ error: "priceId is required" }); return; }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = getStripe();

  const { data: userData } = await supabase.auth.getUser(
    req.headers.authorization!.replace("Bearer ", "")
  );
  const email = userData.user?.email;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", req.userId)
    .single();

  let customerId = sub?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: req.userId! },
    });
    customerId = customer.id;
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", req.userId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/download?subscribed=1`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { user_id: req.userId! },
  });

  res.json({ url: session.url });
});

// POST /subscription/portal — create Stripe Customer Portal session
router.post("/portal", requireAuth, async (req: AuthRequest, res: any) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const stripe = getStripe();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", req.userId)
    .single();

  if (!sub?.stripe_customer_id) {
    res.status(400).json({ error: "No billing account found" });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id as string,
    return_url: `${appUrl}/dashboard`,
  });

  res.json({ url: session.url });
});

// GET /subscription/status
router.get("/status", requireAuth, async (req: AuthRequest, res: any) => {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "tier, subscription_status, billing_cycle, subscription_end_date, minutes_used, minutes_limit"
    )
    .eq("user_id", req.userId)
    .single();

  if (!sub) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  const tier = (sub.tier as Tier) || "free";
  res.json({ ...sub, features: FEATURE_FLAGS[tier] });
});

// GET /auth/me — returns user profile + tier + feature flags
router.get("/me", requireAuth, async (req: AuthRequest, res: any) => {
  const { data: userData } = await supabase.auth.getUser(
    req.headers.authorization!.replace("Bearer ", "")
  );
  const user = userData.user;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, subscription_status, minutes_used, minutes_limit")
    .eq("user_id", req.userId)
    .single();

  const tier = (sub?.tier as Tier) || "free";

  res.json({
    id: user?.id,
    name: user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "",
    email: user?.email,
    tier,
    subscription_status: sub?.subscription_status ?? null,
    features: FEATURE_FLAGS[tier],
  });
});

export default router;
