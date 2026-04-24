import { Queue } from "bullmq";
import { redis } from "../lib/redis";
import type { JobType } from "@autocut/types";

export const processingQueue = new Queue("processing", { connection: redis });

export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>
) {
  const job = await processingQueue.add(type, payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
  return job.id!;
}
