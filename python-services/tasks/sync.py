import os
import tempfile
import numpy as np
import librosa
import ffmpeg
from worker import app
from tasks._helpers import download_clip, upload_output, update_job_status


def find_offset(reference: np.ndarray, target: np.ndarray, sr: int) -> float:
    """Cross-correlate two audio signals to find the time offset of target relative to reference."""
    correlation = np.correlate(reference, target[:len(reference)], mode="full")
    lag = np.argmax(np.abs(correlation)) - (len(reference) - 1)
    return lag / sr


@app.task(bind=True, name="sync")
def sync(self, jobId: str, userId: str, projectId: str, clipIds: list, options: dict = None):
    if len(clipIds) < 2:
        update_job_status(jobId, "failed", 0, error="At least 2 clips required for sync")
        return

    update_job_status(jobId, "processing", 5)

    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for i, clip_id in enumerate(clipIds):
            p = os.path.join(tmp, f"clip_{i}.mp4")
            download_clip(clip_id, userId, p)
            paths.append(p)

        update_job_status(jobId, "processing", 30)

        # Load audio from all clips and find offsets relative to first clip
        ref_audio, sr = librosa.load(paths[0], sr=22050, mono=True)
        offsets = [0.0]
        for path in paths[1:]:
            target_audio, _ = librosa.load(path, sr=22050, mono=True)
            offset = find_offset(ref_audio, target_audio, sr)
            offsets.append(offset)

        update_job_status(jobId, "processing", 60)

        # Build an FFmpeg concat with delays applied
        inputs = [ffmpeg.input(p) for p in paths]
        delayed = []
        for i, (inp, offset) in enumerate(zip(inputs, offsets)):
            delay_ms = max(0, int(offset * 1000))
            delayed.append(inp.audio.filter("adelay", f"{delay_ms}|{delay_ms}"))

        output_path = os.path.join(tmp, "synced.mp4")
        merged = ffmpeg.filter(delayed, "amix", inputs=len(delayed), duration="first")
        ffmpeg.output(inputs[0].video, merged, output_path, vcodec="copy", acodec="aac").overwrite_output().run(quiet=True)

        update_job_status(jobId, "processing", 90)
        remote = upload_output(output_path, userId, jobId, "synced.mp4")

    update_job_status(jobId, "done", 100, output_path=remote)
    return {"jobId": jobId, "outputPath": remote, "offsets": offsets}
