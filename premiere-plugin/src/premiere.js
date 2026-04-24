/**
 * Premiere Pro bridge — CEP / CSInterface version.
 * Calls ExtendScript functions in src/jsx/premiere.jsx via evalScript.
 */

const Premiere = (() => {
  const cs = new CSInterface();

  function evalScript(fn, ...args) {
    return new Promise((resolve, reject) => {
      const argStr = args.map((a) =>
        typeof a === "string" ? `${JSON.stringify(a)}` : JSON.stringify(a)
      ).join(",");
      const call = args.length ? `${fn}(${argStr})` : `${fn}()`;
      cs.evalScript(call, (result) => {
        if (result === "EvalScript error." || (result && result.startsWith("ERROR:"))) {
          reject(new Error(result));
        } else {
          resolve(result);
        }
      });
    });
  }

  async function getActiveSequence() {
    const raw = await evalScript("getActiveSequence");
    const data = JSON.parse(raw);
    if (!data || data.error) return null;
    return data;
  }

  async function applySilenceCuts(silenceRanges) {
    return evalScript("applySilenceCuts", JSON.stringify(silenceRanges));
  }

  async function addMarkers(points, label) {
    return evalScript("addMarkers", JSON.stringify(points), label || "AutoCut");
  }

  async function importProcessedFile(localPath, binName) {
    return evalScript("importFile", localPath, binName || "AutoCut Exports");
  }

  async function importSRTFile(srtPath) {
    return evalScript("importSRTFile", srtPath);
  }

  async function setPlayhead(seconds) {
    return evalScript("setPlayhead", seconds);
  }

  // Write SRT text to a temp file and import it
  async function applyCaptionTrack(srtContent) {
    return new Promise((resolve, reject) => {
      // Write via ExtendScript File object (avoids needing UXP storage API)
      const escaped = srtContent.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
      const script = `
        (function() {
          var f = new File(Folder.temp.fsName + "/autocut_subtitles.srt");
          f.open("w");
          f.write("${escaped}");
          f.close();
          return importSRTFile(f.fsName);
        })()
      `;
      cs.evalScript(script, (result) => {
        if (result && result.startsWith("ERROR:")) reject(new Error(result));
        else resolve(result);
      });
    });
  }

  // Upload clip files from the sequence using XHR (CEP has full network access)
  async function getClipFiles(sequence) {
    // In CEP we get the file paths directly from ExtendScript — no file picker needed
    return sequence.clips
      .filter((c) => c.mediaPath && c.unique)
      .map((c) => ({ path: c.mediaPath, name: c.name, clip: c }));
  }

  return {
    getActiveSequence,
    getClipFiles,
    applySilenceCuts,
    addMarkers,
    applyCaptionTrack,
    importProcessedFile,
    importSRTFile,
    setPlayhead,
  };
})();
