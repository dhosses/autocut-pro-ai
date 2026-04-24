import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { enqueueJob } from "../jobs/queue";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

const ExportBody = z.object({
  projectId: z.string().uuid(),
  format: z.enum(["fcpxml", "srt", "mp4"]),
});

router.post("/", requireAuth, async (req: AuthRequest, res: any) => {
  const parsed = ExportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const jobId = randomUUID();
  const jobType = parsed.data.format === "fcpxml" ? "export-xml" : "export-video";

  await supabase.from("jobs").insert({
    id: jobId,
    user_id: req.userId,
    project_id: parsed.data.projectId,
    type: jobType,
    status: "queued",
    payload: { format: parsed.data.format },
  });

  await enqueueJob(jobType, {
    jobId,
    userId: req.userId,
    projectId: parsed.data.projectId,
    format: parsed.data.format,
  });

  res.json({ jobId, status: "queued" });
});

router.get("/:jobId/download", requireAuth, async (req: AuthRequest, res: any) => {
  const { data: job } = await supabase
    .from("jobs")
    .select("status, output_path")
    .eq("id", req.params.jobId)
    .eq("user_id", req.userId)
    .single();

  if (!job || job.status !== "done" || !job.output_path) {
    res.status(404).json({ error: "Export not ready" });
    return;
  }

  const { data } = await supabase.storage
    .from("exports")
    .createSignedUrl(job.output_path, 3600);

  if (!data?.signedUrl) {
    res.status(500).json({ error: "Could not generate download URL" });
    return;
  }

  res.json({ url: data.signedUrl, expiresIn: 3600 });
});

export default router;
