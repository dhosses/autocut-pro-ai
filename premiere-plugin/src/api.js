/**
 * AutoCut Pro AI backend API client.
 */

const API_URL = "http://localhost:4000";

const Api = (() => {

  async function _headers(contentType) {
    const token = await Auth.getToken();
    const h = { Authorization: `Bearer ${token}` };
    if (contentType) h["Content-Type"] = contentType;
    return h;
  }

  async function createProject(name) {
    const res = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: await _headers("application/json"),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Could not create project");
    return res.json();
  }

  async function uploadFile(file, projectId, onProgress) {
    const token = await Auth.getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("projectId", projectId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(form);
    });
  }

  async function processClips(type, projectId, clipIds, options) {
    const res = await fetch(`${API_URL}/process/${type}`, {
      method: "POST",
      headers: await _headers("application/json"),
      body: JSON.stringify({ projectId, clipIds, options }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 402) throw new Error("QUOTA_EXCEEDED");
      throw new Error(body.error || `Process failed (${res.status})`);
    }
    return res.json();
  }

  async function pollJob(jobId, onUpdate) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const token = await Auth.getToken();
          const res = await fetch(`${API_URL}/jobs/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) { reject(new Error("Job fetch failed")); return; }
          const job = await res.json();
          onUpdate(job);
          if (job.status === "done") { resolve(job); return; }
          if (job.status === "failed") { reject(new Error(job.error || "Job failed")); return; }
          setTimeout(poll, 2500);
        } catch (e) { reject(e); }
      };
      poll();
    });
  }

  async function getSignedDownloadUrl(jobId) {
    const res = await fetch(`${API_URL}/export/${jobId}/download`, {
      headers: await _headers(),
    });
    if (!res.ok) throw new Error("Download not ready");
    return res.json();
  }

  return { createProject, uploadFile, processClips, pollJob, getSignedDownloadUrl };
})();
