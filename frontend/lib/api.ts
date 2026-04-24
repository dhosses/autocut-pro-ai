import { supabase } from "./supabase";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function uploadClip(file: File, projectId: string) {
  const headers = await authHeaders();
  const form = new FormData();
  form.append("file", file);
  form.append("projectId", projectId);
  const res = await fetch(`${API}/upload`, { method: "POST", headers, body: form });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function processClips(
  endpoint: string,
  projectId: string,
  clipIds: string[],
  options?: Record<string, unknown>
) {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API}/process/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ projectId, clipIds, options }),
  });
  if (!res.ok) throw new Error(`Process failed: ${endpoint}`);
  return res.json();
}

export async function requestExport(projectId: string, format: "fcpxml" | "srt" | "mp4") {
  const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
  const res = await fetch(`${API}/export`, {
    method: "POST",
    headers,
    body: JSON.stringify({ projectId, format }),
  });
  if (!res.ok) throw new Error("Export request failed");
  return res.json();
}

export async function getDownloadUrl(jobId: string) {
  const headers = await authHeaders();
  const res = await fetch(`${API}/export/${jobId}/download`, { headers });
  if (!res.ok) throw new Error("Download not ready");
  return res.json() as Promise<{ url: string; expiresIn: number }>;
}

export function subscribeToJobStatus(
  jobId: string,
  token: string,
  onUpdate: (data: unknown) => void
): () => void {
  const es = new EventSource(`${API}/process/${jobId}/status?token=${token}`);
  es.onmessage = (e) => onUpdate(JSON.parse(e.data));
  return () => es.close();
}
