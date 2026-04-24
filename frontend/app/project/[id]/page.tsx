"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { processClips } from "@/lib/api";
import UploadZone from "@/components/upload-zone";
import JobStatusBadge from "@/components/job-status-badge";
import TimelinePreview from "@/components/timeline-preview";

interface ActiveJob {
  id: string;
  type: string;
}

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const [clipIds, setClipIds] = useState<string[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/login");
    });
  }, [router]);

  async function runProcess(endpoint: string, options?: Record<string, unknown>) {
    if (clipIds.length === 0) return alert("Upload at least one clip first");
    setProcessing(endpoint);
    try {
      const { jobId } = await processClips(endpoint, projectId, clipIds, options);
      setActiveJobs((prev) => [...prev, { id: jobId, type: endpoint }]);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white">← Dashboard</Link>
        <h1 className="text-xl font-bold">Project Editor</h1>
      </header>

      <UploadZone
        projectId={projectId}
        onUploaded={(clipId) => setClipIds((prev) => [...prev, clipId])}
      />

      {clipIds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Processing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Trim Silence", endpoint: "silence-trim", icon: "✂️" },
              { label: "Generate Subtitles", endpoint: "subtitles", icon: "💬" },
              { label: "Sync Cameras", endpoint: "sync", icon: "🔗" },
              { label: "Track Subject", endpoint: "tracking", icon: "👤" },
            ].map((action) => (
              <button
                key={action.endpoint}
                onClick={() => runProcess(action.endpoint)}
                disabled={processing !== null}
                className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl p-4 text-left transition-colors"
              >
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <div className="font-medium text-sm">{action.label}</div>
                  {processing === action.endpoint && (
                    <div className="text-xs text-gray-400">Queuing…</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Jobs</h2>
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <div key={job.id} className="bg-gray-900 rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm capitalize">{job.type.replace("-", " ")}</span>
                <JobStatusBadge jobId={job.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <TimelinePreview segments={[]} totalDuration={0} />

      {activeJobs.length > 0 && (
        <Link
          href={`/project/${projectId}/export`}
          className="block text-center py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
        >
          Export project →
        </Link>
      )}
    </main>
  );
}
