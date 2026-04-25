import { Router } from "express";
import path from "path";
import fs from "fs";
import { supabase } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

const DIST_DIR = path.resolve(__dirname, "../../../installer-app/dist");

// async function checkPaidSubscription(userId: string): Promise<boolean> {
//   const { data } = await supabase
//     .from("subscriptions")
//     .select("tier")
//     .eq("user_id", userId)
//     .single();
//   return data?.tier === "basic" || data?.tier === "pro";
// }

function serveInstaller(filename: string, downloadName: string) {
  return async (req: AuthRequest, res: any) => {
    // const isPaid = await checkPaidSubscription(req.userId!);
    // if (!isPaid) { res.status(403).json({ error: "Active subscription required" }); return; }

    const filePath = path.join(DIST_DIR, filename);
    if (!fs.existsSync(filePath)) {
      res.status(503).json({ error: "Installer not yet built for this platform" });
      return;
    }

    res.download(filePath, downloadName);
  };
}

router.get("/mac-arm64", requireAuth, serveInstaller(
  "AutoCut Pro AI-1.0.0-arm64.dmg",
  "AutoCut Pro AI Installer (Apple Silicon).dmg"
));

router.get("/mac-intel", requireAuth, serveInstaller(
  "AutoCut Pro AI-1.0.0.dmg",
  "AutoCut Pro AI Installer (Intel).dmg"
));

// Legacy route — defaults to Apple Silicon
router.get("/mac", requireAuth, serveInstaller(
  "AutoCut Pro AI-1.0.0-arm64.dmg",
  "AutoCut Pro AI Installer.dmg"
));

router.get("/windows", requireAuth, serveInstaller(
  "AutoCut Pro AI Setup 1.0.0.exe",
  "AutoCut Pro AI Installer.exe"
));

// Subscription status endpoint
router.get("/me", requireAuth, async (req: AuthRequest, res: any) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier, status, minutes_used, minutes_limit")
    .eq("user_id", req.userId)
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  res.json(data);
});

export default router;
