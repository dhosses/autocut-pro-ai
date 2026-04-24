/**
 * AutoCut Pro AI — ExtendScript
 * Runs inside Premiere Pro. Called from the panel via CSInterface.evalScript().
 * All functions return JSON strings.
 */

// ── Sequence info ─────────────────────────────────────────────────────────────

function getActiveSequence() {
  try {
    if (!app.project || !app.project.activeSequence) return JSON.stringify(null);
    var seq = app.project.activeSequence;
    var clips = [];
    var seen = {};

    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var track = seq.videoTracks[t];
      for (var c = 0; c < track.trackItems.numItems; c++) {
        var item = track.trackItems[c];
        if (item.type !== TrackItemType.CLIP) continue;
        var mediaPath = "";
        try { mediaPath = item.projectItem.getMediaPath(); } catch(e) {}
        var key = mediaPath || item.name;
        clips.push({
          name: item.name,
          mediaPath: mediaPath,
          startSeconds: ticksToSeconds(item.start.ticks),
          endSeconds: ticksToSeconds(item.end.ticks),
          trackIndex: t,
          clipIndex: c,
          unique: !seen[key]
        });
        seen[key] = true;
      }
    }

    return JSON.stringify({
      id: seq.sequenceID,
      name: seq.name,
      clipCount: clips.length,
      clips: clips,
      framerate: seq.videoDisplayFormat
    });
  } catch(e) {
    return JSON.stringify({ error: e.toString() });
  }
}

// ── Silence cuts ──────────────────────────────────────────────────────────────

function applySilenceCuts(rangesJson) {
  try {
    var ranges = JSON.parse(rangesJson);
    var seq = app.project.activeSequence;
    if (!seq) return "NO_SEQUENCE";

    // Sort descending — cut from end to start to preserve timecodes
    ranges.sort(function(a, b) { return b.start - a.start; });

    var removed = 0;
    for (var i = 0; i < ranges.length; i++) {
      var startTicks = secondsToTicks(ranges[i].start);
      var endTicks   = secondsToTicks(ranges[i].end);
      var startTime  = new Time(); startTime.ticks = startTicks;
      var endTime    = new Time(); endTime.ticks   = endTicks;

      seq.razorAtTime(startTime, true, true);
      seq.razorAtTime(endTime,   true, true);

      // Remove clips that fall entirely within the silence range
      var allTracks = [];
      for (var vt = 0; vt < seq.videoTracks.numTracks; vt++) allTracks.push(seq.videoTracks[vt]);
      for (var at = 0; at < seq.audioTracks.numTracks; at++) allTracks.push(seq.audioTracks[at]);

      for (var tt = 0; tt < allTracks.length; tt++) {
        var track = allTracks[tt];
        for (var c = track.trackItems.numItems - 1; c >= 0; c--) {
          var item = track.trackItems[c];
          if (item.type !== TrackItemType.CLIP) continue;
          if (item.start.ticks >= startTicks && item.end.ticks <= endTicks) {
            item.remove(false, true);
            removed++;
          }
        }
      }
    }
    return "REMOVED:" + removed;
  } catch(e) {
    return "ERROR:" + e.toString();
  }
}

// ── Markers ───────────────────────────────────────────────────────────────────

function addMarkers(pointsJson, label) {
  try {
    var points = JSON.parse(pointsJson);
    var seq = app.project.activeSequence;
    if (!seq) return "NO_SEQUENCE";

    for (var i = 0; i < points.length; i++) {
      var t = new Time();
      t.ticks = secondsToTicks(points[i]);
      var marker = seq.markers.createMarker(t);
      marker.name = label || "AutoCut";
      marker.comments = "Added by AutoCut Pro AI";
    }
    return "MARKERS:" + points.length;
  } catch(e) {
    return "ERROR:" + e.toString();
  }
}

// ── Import file into project bin ──────────────────────────────────────────────

function importFile(filePath, binName) {
  try {
    var project = app.project;
    var targetBin = project.rootItem;
    var name = binName || "AutoCut Exports";

    for (var i = 0; i < project.rootItem.children.numItems; i++) {
      if (project.rootItem.children[i].name === name) {
        targetBin = project.rootItem.children[i];
        break;
      }
    }
    if (targetBin === project.rootItem) {
      targetBin = project.rootItem.createBin(name);
    }

    var ok = project.importFiles([filePath], true, targetBin, false);
    return ok ? "IMPORTED" : "FAILED";
  } catch(e) {
    return "ERROR:" + e.toString();
  }
}

// ── Import SRT as caption track ───────────────────────────────────────────────

function importSRTFile(srtPath) {
  try {
    var ok = app.project.importFiles([srtPath], true, app.project.rootItem, false);
    return ok ? "IMPORTED" : "FAILED";
  } catch(e) {
    return "ERROR:" + e.toString();
  }
}

// ── Set playhead ──────────────────────────────────────────────────────────────

function setPlayhead(seconds) {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "NO_SEQUENCE";
    seq.setPlayerPosition(secondsToTicks(seconds));
    return "OK";
  } catch(e) {
    return "ERROR:" + e.toString();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ticksToSeconds(ticks) {
  return parseInt(ticks, 10) / 254016000000;
}

function secondsToTicks(seconds) {
  return Math.round(seconds * 254016000000).toString();
}
