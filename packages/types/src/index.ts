import { z } from "zod";

export const JobStatus = z.enum(["queued", "processing", "done", "failed"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobType = z.enum([
  "silence-trim",
  "subtitles",
  "sync",
  "tracking",
  "export-xml",
  "export-video",
]);
export type JobType = z.infer<typeof JobType>;

export const UploadResponseSchema = z.object({
  jobId: z.string().uuid(),
  clipId: z.string().uuid(),
  path: z.string(),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

export const ProcessRequestSchema = z.object({
  projectId: z.string().uuid(),
  clipIds: z.array(z.string().uuid()),
  options: z.record(z.unknown()).optional(),
});
export type ProcessRequest = z.infer<typeof ProcessRequestSchema>;

export const JobStatusResponseSchema = z.object({
  jobId: z.string().uuid(),
  type: JobType,
  status: JobStatus,
  progress: z.number().min(0).max(100).optional(),
  outputPath: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;

export const ExportRequestSchema = z.object({
  projectId: z.string().uuid(),
  format: z.enum(["fcpxml", "srt", "mp4"]),
});
export type ExportRequest = z.infer<typeof ExportRequestSchema>;

export const SubscriptionTier = z.enum(["free", "pro"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTier>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  tier: SubscriptionTier,
  minutesUsed: z.number(),
  minutesLimit: z.number(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
