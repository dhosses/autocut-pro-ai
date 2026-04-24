/**
 * Premiere Pro UXP API bridge.
 * Uses native UXP APIs where available, falls back to ExtendScript via evalScript.
 */

const Premiere = (() => {
  // UXP module for Premiere Pro (available inside the plugin runtime)
  let ppro;
  try { ppro = require("premierepro"); } catch (_) {}

  // Run ExtendScript in Premiere Pro for operations not yet in UXP API
  async function evalScript(script) {
    if (ppro?.app?.evalScript) return ppro.app.evalScript(script);
    // Fallback for older UXP runtime
    return new Promise((resolve, reject) => {
      if (typeof window.__adobe_cep__ !== "undefined") {
        window.__adobe_cep__.evalScript(script, (result) => resolve(result));
      } else {
        reject(new Error("evalScript not available"));
      }
    });
  }

  // ── Read active sequence ──────────────────────────────────────────────────

  async function getActiveSequence() {
    try {
      const project = ppro?.app?.project;
      if (!project) return null;
      const seq = project.activeSequence;
      if (!seq) return null;

      const videoTracks = seq.videoTracks;
      let clipCount = 0;
      const clips = [];

      for (let t = 0; t < videoTracks.numTracks; t++) {
        const track = videoTracks[t];
        for (let c = 0; c < track.trackItems.numItems; c++) {
          const item = track.trackItems[c];
          const mediaPath = item.projectItem?.getMediaPath?.() || "";
          clips.push({
            name: item.name,
            mediaPath,
            startSeconds: _ticksToSeconds(item.startTime?.ticks || "0"),
            endSeconds: _ticksToSeconds(item.endTime?.ticks || "0"),
            trackIndex: t,
            clipIndex: c,
          });
          clipCount++;
        }
      }

      return {
        name: seq.name,
        id: seq.sequenceID,
        clipCount,
        clips,
        frameRate: seq.videoDisplayFormat || "29.97",
      };
    } catch (e) {
      console.error("getActiveSequence error:", e);
      return null;
    }
  }

  // ── Read clip files for upload ────────────────────────────────────────────

  async function getClipFiles(sequence) {
    const { localFileSystem } = require("uxp").storage;
    const files = [];
    const seen = new Set();

    for (const clip of sequence.clips) {
      if (!clip.mediaPath || seen.has(clip.mediaPath)) continue;
      seen.add(clip.mediaPath);
      try {
        const file = await localFileSystem.getEntryWithUrl(`file://${clip.mediaPath}`);
        files.push({ file, clip });
      } catch (e) {
        console.warn(`Could not open file: ${clip.mediaPath}`, e);
      }
    }
    return files;
  }

  // ── Apply silence cuts to timeline ────────────────────────────────────────

  async function applySilenceCuts(silenceRanges) {
    // silenceRanges: [{start: seconds, end: seconds}, ...]
    const script = `
      (function() {
        var seq = app.project.activeSequence;
        if (!seq) return "NO_SEQUENCE";
        var ranges = ${JSON.stringify(silenceRanges)};
        var count = 0;

        // Sort descending so we cut from end to start (preserves earlier timecodes)
        ranges.sort(function(a, b) { return b.start - a.start; });

        for (var i = 0; i < ranges.length; i++) {
          var startTicks = ranges[i].start * 254016000000;
          var endTicks   = ranges[i].end   * 254016000000;
          var startTime  = new Time(); startTime.ticks = startTicks.toString();
          var endTime    = new Time(); endTime.ticks   = endTicks.toString();

          // Razor cut at start and end of silence
          seq.razorAtTime(startTime, true, true);
          seq.razorAtTime(endTime,   true, true);

          // Select and delete the silence segment across all tracks
          var tracks = [seq.videoTracks, seq.audioTracks];
          for (var tt = 0; tt < tracks.length; tt++) {
            for (var t = 0; t < tracks[tt].numTracks; t++) {
              var track = tracks[tt][t];
              for (var c = track.trackItems.numItems - 1; c >= 0; c--) {
                var item = track.trackItems[c];
                if (item.start.ticks >= startTicks.toString() &&
                    item.end.ticks <= endTicks.toString()) {
                  item.remove(false, true);
                  count++;
                }
              }
            }
          }
        }
        return "REMOVED:" + count;
      })();
    `;
    return evalScript(script);
  }

  // ── Add markers for suggested cuts ───────────────────────────────────────

  async function addMarkers(points, label) {
    const script = `
      (function() {
        var seq = app.project.activeSequence;
        if (!seq) return "NO_SEQUENCE";
        var points = ${JSON.stringify(points)};
        for (var i = 0; i < points.length; i++) {
          var t = new Time();
          t.ticks = (points[i] * 254016000000).toString();
          var marker = seq.markers.createMarker(t);
          marker.name = ${JSON.stringify(label || "AutoCut")};
          marker.comments = "Added by AutoCut Pro AI";
        }
        return "MARKERS:" + points.length;
      })();
    `;
    return evalScript(script);
  }

  // ── Import captions / SRT into Premiere Pro ───────────────────────────────

  async function importSRT(localSRTPath) {
    // Import SRT as a caption track item
    const script = `
      (function() {
        var project = app.project;
        var importPath = ${JSON.stringify(localSRTPath)};
        var result = project.importFiles([importPath], true, project.rootItem, false);
        return result ? "IMPORTED" : "FAILED";
      })();
    `;
    return evalScript(script);
  }

  // ── Apply subtitles directly as caption track ─────────────────────────────

  async function applyCaptionTrack(srtContent) {
    // Write SRT to a temp file then import it
    const { localFileSystem } = require("uxp").storage;
    const tmp = await localFileSystem.getTemporaryFolder();
    const srtFile = await tmp.createFile("autocut_subtitles.srt", { overwrite: true });
    await srtFile.write(srtContent, { format: localFileSystem.formats.utf8 });
    return importSRT(srtFile.nativePath);
  }

  // ── Move playhead to a specific time ─────────────────────────────────────

  async function setPlayhead(seconds) {
    const script = `
      (function() {
        var seq = app.project.activeSequence;
        if (!seq) return;
        var t = new Time();
        t.ticks = (${seconds} * 254016000000).toString();
        seq.setPlayerPosition(t.ticks);
      })();
    `;
    return evalScript(script);
  }

  // ── Import a processed video file into the project bin ───────────────────

  async function importProcessedFile(localPath, binName) {
    const script = `
      (function() {
        var project = app.project;
        var targetBin = project.rootItem;

        // Find or create the bin
        var binNameStr = ${JSON.stringify(binName || "AutoCut Exports")};
        for (var i = 0; i < project.rootItem.children.numItems; i++) {
          if (project.rootItem.children[i].name === binNameStr) {
            targetBin = project.rootItem.children[i];
            break;
          }
        }
        if (targetBin === project.rootItem) {
          targetBin = project.rootItem.createBin(binNameStr);
        }

        var imported = project.importFiles(
          [${JSON.stringify(localPath)}],
          true,
          targetBin,
          false
        );
        return imported ? "IMPORTED" : "FAILED";
      })();
    `;
    return evalScript(script);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function _ticksToSeconds(ticks) {
    // Premiere Pro uses 254016000000 ticks per second
    return Number(ticks) / 254016000000;
  }

  return {
    getActiveSequence,
    getClipFiles,
    applySilenceCuts,
    addMarkers,
    applyCaptionTrack,
    setPlayhead,
    importProcessedFile,
  };
})();
