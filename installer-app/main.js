const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const { exec, execSync } = require("child_process");
const os = require("os");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 580,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: "#111111",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  win.loadFile("index.html");
  win.once("ready-to-show", () => win.show());
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());

// ── IPC: window controls ──────────────────────────────────────────────────────
ipcMain.on("close-window", () => win.close());
ipcMain.on("minimize-window", () => win.minimize());

// ── IPC: open Premiere Pro ────────────────────────────────────────────────────
ipcMain.on("open-premiere", () => {
  const apps = [
    "Adobe Premiere Pro 2025",
    "Adobe Premiere Pro 2024",
    "Adobe Premiere Pro 2023",
    "Adobe Premiere Pro 2022",
    "Adobe Premiere Pro",
  ];
  for (const name of apps) {
    try {
      execSync(`open -a "${name}"`, { stdio: "ignore" });
      return;
    } catch (_) {}
  }
});

// ── IPC: run install ──────────────────────────────────────────────────────────
ipcMain.handle("install", async (event) => {
  const send = (step, status, message) => {
    win.webContents.send("install-progress", { step, status, message });
  };

  try {
    // ── Step 1: Find plugin source ──────────────────────────────────────────
    send(1, "active", "Finding plugin files…");

    // In packaged app, plugin is in extraResources; in dev it's a sibling folder
    let pluginSrc;
    if (app.isPackaged) {
      pluginSrc = path.join(process.resourcesPath, "premiere-plugin");
    } else {
      pluginSrc = path.resolve(__dirname, "../premiere-plugin");
    }

    if (!fs.existsSync(pluginSrc)) {
      throw new Error("Plugin source not found at: " + pluginSrc);
    }
    send(1, "done", "Plugin files found");

    // ── Step 2: Download CSInterface.js ────────────────────────────────────
    send(2, "active", "Downloading Adobe CSInterface…");

    const libDir = path.join(pluginSrc, "lib");
    fs.mkdirSync(libDir, { recursive: true });
    const csPath = path.join(libDir, "CSInterface.js");

    await downloadFile(
      "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_11.x/CSInterface.js",
      csPath
    );
    send(2, "done", "Adobe CSInterface downloaded");

    // ── Step 3: Enable CEP debug mode ──────────────────────────────────────
    send(3, "active", "Configuring Premiere Pro…");

    for (const v of [12, 11, 10, 9]) {
      try {
        if (process.platform === "win32") {
          execSync(`reg add "HKCU\\Software\\Adobe\\CSXS.${v}" /v PlayerDebugMode /t REG_SZ /d 1 /f`, { stdio: "ignore" });
        } else {
          execSync(`defaults write com.adobe.CSXS.${v} PlayerDebugMode 1`, { stdio: "ignore" });
        }
      } catch (_) {}
    }
    send(3, "done", "Premiere Pro configured");

    // ── Step 4: Install extension ───────────────────────────────────────────
    send(4, "active", "Installing extension…");

    const extDir = process.platform === "win32"
      ? path.join(process.env.APPDATA, "Adobe/CEP/extensions")
      : path.join(os.homedir(), "Library/Application Support/Adobe/CEP/extensions");
    fs.mkdirSync(extDir, { recursive: true });

    const dest = path.join(extDir, "com.autocutproai.panel");

    // Remove old install (existsSync handles symlinks and dirs)
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    // Symlink in dev, copy in packaged (packaged resources are read-only)
    if (app.isPackaged) {
      copyDirSync(pluginSrc, dest);
    } else {
      fs.symlinkSync(pluginSrc, dest);
    }

    send(4, "done", "Extension installed");

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (e) => {
      fs.unlink(dest, () => {});
      reject(e);
    });
  });
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
