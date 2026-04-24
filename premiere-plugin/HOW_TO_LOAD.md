# Loading the Plugin into Adobe Premiere Pro

## Prerequisites
- Adobe Premiere Pro 2022 (v22.0) or later
- Adobe UXP Developer Tool (free, from Adobe)

---

## Step 1 — Install Adobe UXP Developer Tool

1. Open the **Creative Cloud desktop app**
2. Go to **Apps** → search "UXP Developer Tool"
3. Install it (it's free)

---

## Step 2 — Load the plugin (development mode)

1. Open **Adobe UXP Developer Tool**
2. Click **Add Plugin**
3. Browse to: `autocut-pro-ai/premiere-plugin/manifest.json`
4. Click **Load**
5. The plugin will appear in the list — click **Load** again to activate it

---

## Step 3 — Open the panel in Premiere Pro

1. Open **Adobe Premiere Pro**
2. Go to **Window → Extensions → AutoCut Pro AI**
3. The panel will appear — sign in with your AutoCut Pro AI account

---

## Step 4 — Using the plugin

1. Open a sequence in Premiere Pro
2. Click **Refresh sequence** in the panel
3. Your clips will be detected automatically
4. Click any processing action (Trim Silence, Subtitles, Sync Cameras, Track Subject)
5. The panel uploads your clips, processes them, and shows live job status
6. When a job is **Done** → click **Apply to timeline** to apply the edits directly

---

## How each action works on the timeline

| Action | What happens in Premiere Pro |
|---|---|
| **Trim Silence** | Razor cuts at silence boundaries, deletes silent segments, closes gaps |
| **Subtitles** | Imports SRT file and adds it as a captions track |
| **Sync Cameras** | Adds markers at sync points for multi-cam alignment |
| **Track Subject** | Imports the cropped/tracked video into the project bin |

---

## For production (publishing to Creative Cloud Marketplace)

1. Sign up at [Adobe Developer Console](https://developer.adobe.com)
2. Create a UXP plugin entry and get your Plugin ID
3. Update `manifest.json` with your official Plugin ID
4. Submit for review via the Creative Cloud Marketplace

---

## Troubleshooting

**Panel doesn't appear in Window menu:**
→ Make sure the plugin is loaded (green dot) in UXP Developer Tool

**"evalScript not available":**
→ Ensure Premiere Pro 2022+ is running, not an older version

**Upload fails:**
→ Make sure the backend is running: `docker-compose up backend`
→ Check that the file permissions allow UXP to read your media files
