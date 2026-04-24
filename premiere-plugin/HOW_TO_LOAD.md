# Loading AutoCut Pro AI into Adobe Premiere Pro

No UXP Developer Tool needed. Three steps.

---

## Step 1 — Download CSInterface.js (one-time)

Download this file and save it as `premiere-plugin/lib/CSInterface.js`:

https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_11.x/CSInterface.js

Or run in terminal:
```bash
curl -o "/Users/dan/PR Project SaaS/premiere-plugin/lib/CSInterface.js" \
  "https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/CEP_11.x/CSInterface.js"
```

---

## Step 2 — Enable debug mode + install (run once in terminal)

```bash
# Enable CEP debug mode so unsigned extensions load
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9  PlayerDebugMode 1

# Create the extensions folder if it doesn't exist
mkdir -p ~/Library/Application\ Support/Adobe/CEP/extensions

# Symlink the plugin (changes to the folder apply instantly)
ln -sf "/Users/dan/PR Project SaaS/premiere-plugin" \
  ~/Library/Application\ Support/Adobe/CEP/extensions/com.autocutproai.panel
```

---

## Step 3 — Open in Premiere Pro

1. **Restart Premiere Pro** (or open it fresh)
2. Go to **Window → Extensions → AutoCut Pro AI**
3. The panel opens — sign in and you're ready

---

## Using the panel

1. Open a sequence in Premiere Pro
2. Click **Refresh sequence** — your clips appear
3. Click any action: **Trim Silence**, **Subtitles**, **Sync Cameras**, **Track Subject**
4. Clips upload to the backend, get processed, status updates live
5. When status shows **Done** → click **Apply to timeline**

| Action | What it does in Premiere Pro |
|---|---|
| Trim Silence | Razor cuts silence, deletes segments, closes gaps |
| Subtitles | Writes SRT to temp folder, imports as captions |
| Sync Cameras | Adds sequence markers at alignment points |
| Track Subject | Downloads tracked MP4, imports into project bin |

---

## Updating the plugin

Because it's symlinked, any code changes are instant — just **reload the panel**:
- Close the panel → reopen via Window → Extensions → AutoCut Pro AI
- Or: right-click inside the panel → Reload

---

## Troubleshooting

**Extension doesn't appear in Window menu:**
```bash
# Make sure debug mode is on for your CSXS version
defaults read com.adobe.CSXS.11 PlayerDebugMode   # should print 1
```
Also check the symlink: `ls ~/Library/Application\ Support/Adobe/CEP/extensions/`

**"EvalScript error" in the panel:**
→ Make sure a sequence is open in Premiere Pro before clicking Refresh

**Upload fails:**
→ Make sure the backend is running: `docker-compose up backend`
