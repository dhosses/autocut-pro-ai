import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.userId = data.user.id;
  next();
}

export async function checkQuota(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, minutes_used, minutes_limit")
    .eq("user_id", req.userId)
    .single();

  if (sub?.tier === "free" && sub.minutes_used >= sub.minutes_limit) {
    res.status(402).json({
      error: "Free quota exceeded",
      code: "QUOTA_EXCEEDED",
    });
    return;
  }

  next();
}
