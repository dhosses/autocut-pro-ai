// ── Screen navigation ─────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ── Title bar ─────────────────────────────────────────────────────────────────
document.getElementById("btnClose").addEventListener("click", () => window.api.closeWindow());
document.getElementById("btnMinimize").addEventListener("click", () => window.api.minimizeWindow());

// ── Install button ────────────────────────────────────────────────────────────
document.getElementById("btnInstall").addEventListener("click", startInstall);
document.getElementById("btnRetry").addEventListener("click", startInstall);
document.getElementById("btnQuit").addEventListener("click", () => window.api.closeWindow());
document.getElementById("btnCopyError").addEventListener("click", () => {
  const msg = document.getElementById("errorMessage").textContent;
  navigator.clipboard.writeText(msg).then(() => {
    const btn = document.getElementById("btnCopyError");
    btn.textContent = "✓ Copied";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy Error";
      btn.classList.remove("copied");
    }, 2000);
  });
});
document.getElementById("btnDone").addEventListener("click", () => window.api.closeWindow());
document.getElementById("btnOpenPremiere").addEventListener("click", () => {
  window.api.openPremiere();
  window.api.closeWindow();
});

// ── Progress listener ─────────────────────────────────────────────────────────
window.api.onProgress(({ step, status, message }) => {
  const el = document.getElementById(`step-${step}`);
  if (!el) return;

  // Clear previous state
  el.classList.remove("active", "done", "error");
  el.classList.add(status);

  const sub = el.querySelector(".step-sub");
  if (sub && message) sub.textContent = message;

  // Progress bar: 25% per completed step
  const fill = document.getElementById("progressFill");
  const pct = status === "done" ? step * 25 : (step - 1) * 25 + 10;
  fill.style.width = pct + "%";
});

// ── Run install ───────────────────────────────────────────────────────────────
async function startInstall() {
  // Reset step UI
  document.querySelectorAll(".step").forEach((el) => {
    el.classList.remove("active", "done", "error");
    el.querySelectorAll(".step-sub").forEach((s) => (s.textContent = ""));
  });
  document.getElementById("progressFill").style.width = "0%";

  show("screenInstalling");

  const result = await window.api.install();

  if (result.success) {
    document.getElementById("progressFill").style.width = "100%";
    setTimeout(() => show("screenSuccess"), 400);
  } else {
    document.getElementById("errorMessage").textContent = result.error || "Unknown error";
    show("screenError");
  }
}
