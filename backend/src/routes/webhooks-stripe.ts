import { Router } from "express";
import Stripe from "stripe";
import { supabase } from "../lib/supabase";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as any,
});

function getTierFromPriceId(priceId: string): "basic" | "pro" {
  const basicIds = [
    process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
  ];
  return basicIds.includes(priceId) ? "basic" : "pro";
}

function getMinutesLimit(tier: "basic" | "pro"): number | null {
  return tier === "basic" ? 200 : null;
}

router.post("/stripe", async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook signature invalid:", err.message);
    res.status(400).json({ error: "Webhook signature invalid" });
    return;
  }

  try {
    switch (event.type as string) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { user_id?: string };
          subscription?: string;
          customer?: string;
        };
        const userId = session.metadata?.user_id;
        if (!userId || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription) as any;
        const priceId: string = sub.items.data[0]?.price?.id ?? "";
        const tier = getTierFromPriceId(priceId);
        const minutesLimit = getMinutesLimit(tier);
        const billingCycle =
          sub.items.data[0]?.price?.recurring?.interval === "year"
            ? "yearly"
            : "monthly";

        await supabase
          .from("subscriptions")
          .update({
            tier,
            stripe_subscription_id: sub.id,
            stripe_customer_id: session.customer,
            subscription_status: sub.status,
            billing_cycle: billingCycle,
            subscription_end_date: new Date(sub.current_period_end * 1000).toISOString(),
            minutes_limit: minutesLimit,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const { data: record } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .single();
        if (!record) break;

        const priceId: string = sub.items.data[0]?.price?.id ?? "";
        const isActive = sub.status === "active";
        const tier = isActive ? getTierFromPriceId(priceId) : "free";
        const minutesLimit = isActive ? getMinutesLimit(getTierFromPriceId(priceId)) : 30;

        await supabase
          .from("subscriptions")
          .update({
            tier,
            subscription_status: sub.status,
            subscription_end_date: new Date(sub.current_period_end * 1000).toISOString(),
            minutes_limit: minutesLimit,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await supabase
          .from("subscriptions")
          .update({
            tier: "free",
            subscription_status: "cancelled",
            minutes_limit: 30,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
    return;
  }

  res.json({ received: true });
});

export default router;
