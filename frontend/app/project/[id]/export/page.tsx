"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { requestExport, getDownloadUrl } from "@/lib/api";
import JobStatusBadge from "@/components/job-status-badge";

type Format = "fcpxml" | "srt" | "mp4";

interface ExportJob {
  jobId: string;
  format: Format;
  downloadUrl?: string;
}

const FORMATS: { format: Format; label: string; icon: string; description: string }[] = [
  { format: "fcpxml", label: "Premiere Pro XML", icon: "🎬", description: "Import directly into Adobe Premiere Pro" },
  { format: "srt", label: "Subtitles (SRT)", icon: "💬", description: "Standard subtitle file" },
  { format: "mp4", label: "Processed Video", icon: "🎥", description: "Final MP4 with all edits applied" },
];

export default function ExportPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [requesting, setRequesting] = useState<Format | null>(null);

  async function handleExport(format: Format) {
    setRequesting(format);
    try {
      const { jobId } = await requestExport(projectId, format);
      setJobs((prev) => [...prev, { jobId, format }]);
    } finally {
      setRequesting(null);
    }
  }

  async function handleDone(jobId: string) {
    const { url } = await getDownloadUrl(jobId);
    setJobs((prev) => prev.map((j) => j.jobId === jobId ? { ...j, downloadUrl: url } : j));
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <Link href={`/project/${projectId}`} className="text-gray-400 hover:text-white">← Editor</Link>
        <h1 className="text-xl font-bold">Export</h1>
      </header>

      <div className="space-y-3">
        {FORMATS.map(({ format, label, icon, description }) => {
          const job = jobs.find((j) => j.format === format);
          return (
            <div key={format} className="bg-gray-900 rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-gray-500 text-sm">{description}</div>
                  {job && <JobStatusBadge jobId={job.jobId} onDone={() => handleDone(job.jobId)} />}
                </div>
              </div>
              <div className="shrink-0">
                {job?.downloadUrl ? (
                  <a
                    href={job.downloadUrl}
                    download
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    onClick={() => handleExport(format)}
                    disabled={!!job || requesting === format}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {requesting === format ? "…" : "Export"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
