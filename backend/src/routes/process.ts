import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { enqueueJob } from "../jobs/queue";
import { requireAuth, checkQuota, type AuthRequest } from "../middleware/auth";

const router = Router();

const ProcessBody = z.object({
  projectId: z.string().uuid(),
  clipIds: z.array(z.string().uuid()),
  options: z.record(z.unknown()).optional(),
});

function processRoute(jobType: "silence-trim" | "subtitles" | "sync" | "tracking") {
  return [
    requireAuth,
    checkQuota,
    async (req: AuthRequest, res: any) => {
      const parsed = ProcessBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }

      const jobId = randomUUID();
      await supabase.from("jobs").insert({
        id: jobId,
        user_id: req.userId,
        project_id: parsed.data.projectId,
        type: jobType,
        status: "queued",
        payload: { clipIds: parsed.data.clipIds, options: parsed.data.options },
      });

      await enqueueJob(jobType, {
        jobId,
        userId: req.userId,
        ...parsed.data,
      });

      res.json({ jobId, status: "queued" });
    },
  ] as any;
}

router.post("/silence-trim", processRoute("silence-trim"));
router.post("/subtitles", processRoute("subtitles"));
router.post("/sync", processRoute("sync"));
router.post("/tracking", processRoute("tracking"));

router.get("/:jobId/status", requireAuth, async (req: AuthRequest, res: any) => {
  const { jobId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const poll = async () => {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, type, status, progress, output_path, error, created_at, updated_at")
      .eq("id", jobId)
      .eq("user_id", req.userId)
      .single();

    if (!job) {
      send({ error: "Job not found" });
      res.end();
      return;
    }

    send(job);

    if (job.status === "done" || job.status === "failed") {
      res.end();
      return;
    }

    setTimeout(poll, 2000);
  };

  poll();

  req.on("close", () => res.end());
});

export default router;
