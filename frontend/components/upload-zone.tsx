"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadClip } from "@/lib/api";

interface UploadZoneProps {
  projectId: string;
  onUploaded: (clipId: string, fileName: string) => void;
}

interface FileProgress {
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
}

export default function UploadZone({ projectId, onUploaded }: UploadZoneProps) {
  const [files, setFiles] = useState<FileProgress[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted) {
      setFiles((prev) => [...prev, { name: file.name, progress: 0, status: "uploading" }]);
      try {
        const result = await uploadClip(file, projectId);
        setFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, progress: 100, status: "done" } : f)
        );
        onUploaded(result.clipId, file.name);
      } catch {
        setFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, status: "error" } : f)
        );
      }
    }
  }, [projectId, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv"], "audio/*": [".mp3", ".wav", ".m4a"] },
    multiple: true,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-brand-500 bg-brand-500/10" : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📁</div>
        <p className="text-gray-300 font-medium">
          {isDragActive ? "Drop files here" : "Drag & drop video or audio files"}
        </p>
        <p className="text-gray-500 text-sm mt-1">MP4, MOV, AVI, MKV, MP3, WAV supported</p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="bg-gray-900 rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{f.name}</div>
                {f.status === "uploading" && (
                  <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 animate-pulse rounded-full w-1/2" />
                  </div>
                )}
              </div>
              <div className="text-xs shrink-0">
                {f.status === "done" && <span className="text-green-400">Done</span>}
                {f.status === "error" && <span className="text-red-400">Failed</span>}
                {f.status === "uploading" && <span className="text-gray-400">Uploading…</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
