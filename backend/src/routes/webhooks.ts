import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { supabase } from "../lib/supabase";

const router = Router();

function verifySignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

router.post("/lemonsqueezy", async (req: Request, res: Response) => {
  const signature = req.headers["x-signature"] as string;
  if (!signature || !verifySignature(req.body, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const event = JSON.parse(req.body.toString());
  const { meta, data } = event;
  const userId = meta.custom_data?.user_id;
  if (!userId) {
    res.status(400).json({ error: "Missing user_id in custom_data" });
    return;
  }

  const tier = data.attributes.variant_id === process.env.LEMONSQUEEZY_PRO_VARIANT_ID ? "pro" : "free";
  const minutesLimit = tier === "pro" ? 99999 : Number(process.env.FREE_PLAN_MINUTES || 30);

  const eventName: string = meta.event_name;

  if (["subscription_created", "subscription_updated", "subscription_resumed"].includes(eventName)) {
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      tier,
      minutes_limit: minutesLimit,
      lemonsqueezy_subscription_id: data.id,
      lemonsqueezy_customer_id: data.attributes.customer_id,
      status: data.attributes.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  if (["subscription_cancelled", "subscription_expired"].includes(eventName)) {
    await supabase.from("subscriptions").update({
      tier: "free",
      minutes_limit: Number(process.env.FREE_PLAN_MINUTES || 30),
      status: data.attributes.status,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  res.json({ received: true });
});

export default router;
