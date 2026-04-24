/**
 * AutoCut Pro AI — Premiere Pro UXP Panel
 * Main application logic.
 */

const App = (() => {
  let _sequence = null;
  let _projectId = null;
  let _jobs = [];

  // ── Boot ──────────────────────────────────────────────────────────────────

  async function init() {
    if (Auth.isLoggedIn()) {
      _showMainPanel();
      await _refreshSequence();
    } else {
      _showAuthPanel();
    }

    _bindEvents();
  }

  // ── UI state ──────────────────────────────────────────────────────────────

  function _showAuthPanel() {
    document.getElementById("authPanel").classList.remove("hidden");
    document.getElementById("mainPanel").classList.add("hidden");
  }

  function _showMainPanel() {
    document.getElementById("authPanel").classList.add("hidden");
    document.getElementById("mainPanel").classList.remove("hidden");
    const user = Auth.getUser();
    const el = document.getElementById("headerUser");
    if (user?.email) {
      el.textContent = user.email;
      el.classList.remove("hidden");
    }
  }

  // ── Auth events ───────────────────────────────────────────────────────────

  async function _handleSignIn() {
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const errEl = document.getElementById("authError");
    const btn = document.getElementById("authSubmit");
    const btnText = document.getElementById("authBtnText");
    const spinner = document.getElementById("authSpinner");

    errEl.classList.add("hidden");
    btn.disabled = true;
    btnText.textContent = "Signing in…";
    spinner.classList.remove("hidden");

    try {
      await Auth.signIn(email, password);
      _showMainPanel();
      await _refreshSequence();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btnText.textContent = "Sign in";
      spinner.classList.add("hidden");
    }
  }

  async function _handleSignOut() {
    await Auth.signOut();
    _sequence = null;
    _projectId = null;
    _jobs = [];
    _showAuthPanel();
  }

  // ── Sequence ──────────────────────────────────────────────────────────────

  async function _refreshSequence() {
    _sequence = await Premiere.getActiveSequence();
    _renderSequence();
    _updateActionButtons();
  }

  function _renderSequence() {
    const card = document.getElementById("seqCard");
    const empty = document.getElementById("seqEmpty");

    if (!_sequence) {
      card.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");
    card.classList.remove("hidden");
    document.getElementById("seqName").textContent = _sequence.name;
    document.getElementById("seqMeta").textContent =
      `${_sequence.clipCount} clip${_sequence.clipCount !== 1 ? "s" : ""} · ${_sequence.frameRate} fps`;
  }

  function _updateActionButtons() {
    const hasSeq = !!_sequence && _sequence.clipCount > 0;
    ["actionSilence", "actionSubtitles", "actionSync", "actionTracking"].forEach((id) => {
      document.getElementById(id).disabled = !hasSeq;
    });
  }

  // ── Processing ────────────────────────────────────────────────────────────

  async function _runProcess(type) {
    const errEl = document.getElementById("processError");
    errEl.classList.add("hidden");

    try {
      // 1. Upload clips from the sequence
      const clipIds = await _uploadSequenceClips(type);
      if (!clipIds.length) throw new Error("No clips could be uploaded");

      // 2. Ensure we have a project ID
      if (!_projectId) {
        const project = await Api.createProject(`Premiere: ${_sequence.name}`);
        _projectId = project.id;
      }

      // 3. Enqueue processing job
      const { jobId } = await Api.processClips(type, _projectId, clipIds);

      // 4. Add to job list and start polling
      _addJob(jobId, type);
      _pollJob(jobId, type);

    } catch (e) {
      if (e.message === "QUOTA_EXCEEDED") {
        errEl.textContent = "Free quota exceeded — upgrade to Pro at autocutproai.com";
      } else {
        errEl.textContent = e.message;
      }
      errEl.classList.remove("hidden");
    }
  }

  async function _uploadSequenceClips(processType) {
    const uploadSection = document.getElementById("uploadSection");
    const uploadList = document.getElementById("uploadList");
    uploadSection.classList.remove("hidden");
    uploadList.innerHTML = "";

    // Only upload audio for silence/subtitles, all clips for sync/tracking
    const clipsToUpload = _sequence.clips.slice(0, processType === "sync" ? 4 : 1);
    const clipIds = [];
    const seen = new Set();

    for (const clip of clipsToUpload) {
      if (!clip.mediaPath || seen.has(clip.mediaPath)) continue;
      seen.add(clip.mediaPath);

      // Progress row
      const row = document.createElement("div");
      row.style.cssText = "display:flex;flex-direction:column;gap:3px;font-size:10px;color:#888";
      const label = document.createElement("div");
      label.textContent = clip.name;
      const bar = document.createElement("div");
      bar.style.cssText = "height:2px;background:#3a3a3a;border-radius:2px;overflow:hidden";
      const fill = document.createElement("div");
      fill.style.cssText = "height:100%;background:#0ea5e9;width:0%;transition:width 0.2s";
      bar.appendChild(fill);
      row.appendChild(label);
      row.appendChild(bar);
      uploadList.appendChild(row);

      try {
        const fileEntries = await Premiere.getClipFiles({ clips: [clip] });
        if (!fileEntries.length) {
          label.textContent += " (file not accessible)";
          continue;
        }
        const { path } = fileEntries[0];

        if (!_projectId) {
          const proj = await Api.createProject(`Premiere: ${_sequence.name}`);
          _projectId = proj.id;
        }

        const result = await Api.uploadFile(path, _projectId, (pct) => {
          fill.style.width = `${Math.round(pct * 100)}%`;
        });

        fill.style.width = "100%";
        fill.style.background = "#34d399";
        clipIds.push(result.clipId);
      } catch (e) {
        fill.style.background = "#f87171";
        fill.style.width = "100%";
      }
    }

    setTimeout(() => uploadSection.classList.add("hidden"), 2000);
    return clipIds;
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────

  function _addJob(jobId, type) {
    _jobs.unshift({ jobId, type, status: "queued", progress: 0 });
    _renderJobs();
  }

  function _renderJobs() {
    const list = document.getElementById("jobList");
    if (!_jobs.length) {
      list.innerHTML = '<span class="jobs-empty">No jobs yet — run a process above</span>';
      return;
    }

    list.innerHTML = _jobs.map((job, idx) => `
      <div class="job-item" data-idx="${idx}">
        <div class="job-header">
          <span class="job-type">${_labelForType(job.type)}</span>
          <span class="job-status status-${job.status}">${job.status}</span>
        </div>
        ${job.status === "processing" ? `
          <div class="job-progress-bar">
            <div class="job-progress-fill" style="width:${job.progress || 0}%"></div>
          </div>
        ` : ""}
        ${job.status === "done" && !job.applied ? `
          <button class="btn btn-primary btn-sm job-apply-btn" onclick="App.applyJob(${idx})">
            Apply to timeline ✓
          </button>
        ` : ""}
        ${job.applied ? `<span style="font-size:10px;color:#34d399">✓ Applied to timeline</span>` : ""}
        ${job.status === "failed" && job.error ? `<span style="font-size:10px;color:#f87171">${job.error}</span>` : ""}
      </div>
    `).join("");
  }

  async function _pollJob(jobId, type) {
    await Api.pollJob(jobId, (update) => {
      const job = _jobs.find((j) => j.jobId === jobId);
      if (!job) return;
      job.status = update.status;
      job.progress = update.progress || 0;
      job.outputPath = update.output_path;
      job.error = update.error;
      _renderJobs();
    });
  }

  async function applyJob(idx) {
    const job = _jobs[idx];
    if (!job || job.status !== "done") return;

    const errEl = document.getElementById("processError");
    errEl.classList.add("hidden");

    try {
      switch (job.type) {
        case "silence-trim":
          await _applySilenceTrim(job);
          break;
        case "subtitles":
          await _applySubtitles(job);
          break;
        case "sync":
          await _applySync(job);
          break;
        case "tracking":
          await _applyTracking(job);
          break;
      }
      job.applied = true;
      _renderJobs();
    } catch (e) {
      errEl.textContent = `Apply failed: ${e.message}`;
      errEl.classList.remove("hidden");
    }
  }

  async function _applySilenceTrim(job) {
    // Fetch the processed job result to get silence ranges
    const token = await Auth.getToken();
    const res = await fetch(`http://localhost:4000/jobs/${job.jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const silenceRanges = data.payload?.silenceRanges || [];

    if (silenceRanges.length) {
      await Premiere.applySilenceCuts(silenceRanges);
    } else {
      // Fall back: add markers at silent sections so editor can review
      await Premiere.addMarkers(
        silenceRanges.map((r) => r.start),
        "Silence"
      );
    }
  }

  async function _applySubtitles(job) {
    const { url } = await Api.getSignedDownloadUrl(job.jobId);
    const res = await fetch(url);
    const srtContent = await res.text();
    await Premiere.applyCaptionTrack(srtContent);
  }

  async function _applySync(job) {
    // Add markers at sync points for the editor to review
    const token = await Auth.getToken();
    const res = await fetch(`http://localhost:4000/jobs/${job.jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const offsets = data.payload?.offsets || [];
    if (offsets.length) {
      await Premiere.addMarkers(offsets, "Sync point");
    }
  }

  async function _applyTracking(job) {
    const { url } = await Api.getSignedDownloadUrl(job.jobId);
    // Download to OS temp folder then import into project bin via ExtendScript
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer], { type: "video/mp4" });
    const tmpUrl = URL.createObjectURL(blob);
    // ExtendScript can't use blob URLs — download to temp path via XHR first
    const cs = new CSInterface();
    const tmpPath = await new Promise((resolve) => {
      cs.evalScript("Folder.temp.fsName", (r) => resolve(r + "/autocut_tracked.mp4"));
    });
    await _saveBlobToPath(blob, tmpPath);
    await Premiere.importProcessedFile(tmpPath, "AutoCut Exports");
  }

  function _saveBlobToPath(blob, path) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const cs = new CSInterface();
        const bytes = Array.from(new Uint8Array(reader.result));
        const script = `
          (function() {
            var f = new File(${JSON.stringify(path)});
            f.encoding = "binary";
            f.open("w");
            f.write(String.fromCharCode.apply(null, ${JSON.stringify(bytes)}));
            f.close();
            return "OK";
          })()
        `;
        cs.evalScript(script, () => resolve());
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _labelForType(type) {
    return {
      "silence-trim": "Silence Trim",
      subtitles: "Subtitles",
      sync: "Camera Sync",
      tracking: "Subject Track",
    }[type] || type;
  }

  // ── Event binding ─────────────────────────────────────────────────────────

  function _bindEvents() {
    document.getElementById("authSubmit").addEventListener("click", _handleSignIn);
    document.getElementById("authPassword").addEventListener("keydown", (e) => {
      if (e.key === "Enter") _handleSignIn();
    });
    document.getElementById("signOut").addEventListener("click", _handleSignOut);
    document.getElementById("refreshSeq").addEventListener("click", _refreshSequence);
    document.getElementById("openDashboard").addEventListener("click", () => {
      const cs = new CSInterface();
      cs.openURLInDefaultBrowser("http://localhost:3000/dashboard");
    });

    document.getElementById("actionSilence").addEventListener("click", () => _runProcess("silence-trim"));
    document.getElementById("actionSubtitles").addEventListener("click", () => _runProcess("subtitles"));
    document.getElementById("actionSync").addEventListener("click", () => _runProcess("sync"));
    document.getElementById("actionTracking").addEventListener("click", () => _runProcess("tracking"));
  }

  return { init, applyJob };
})();

// Boot when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());
