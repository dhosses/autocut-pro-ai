"use client";
import { useEffect, useState } from "react";
import { subscribeToJobStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Props {
  jobId: string;
  onDone?: (outputPath: string) => void;
}

interface JobState {
  status: "queued" | "processing" | "done" | "failed";
  progress?: number;
  error?: string;
  output_path?: string;
}

const STATUS_COLORS = {
  queued: "text-gray-400",
  processing: "text-brand-500",
  done: "text-green-400",
  failed: "text-red-400",
};

export default function JobStatusBadge({ jobId, onDone }: Props) {
  const [job, setJob] = useState<JobState>({ status: "queued" });

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      cleanup = subscribeToJobStatus(jobId, data.session.access_token, (data) => {
        const j = data as JobState;
        setJob(j);
        if (j.status === "done" && j.output_path) onDone?.(j.output_path);
      });
    });

    return () => cleanup?.();
  }, [jobId, onDone]);

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${STATUS_COLORS[job.status]}`}>
      {job.status === "processing" && (
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
      )}
      <span className="capitalize">{job.status}</span>
      {job.progress !== undefined && job.status === "processing" && (
        <span className="text-gray-500">({job.progress}%)</span>
      )}
      {job.error && <span className="text-red-400 text-xs ml-1">{job.error}</span>}
    </span>
  );
}
