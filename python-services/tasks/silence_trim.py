import os
import tempfile
import librosa
import ffmpeg
from worker import app
from tasks._helpers import download_clip, upload_output, update_job_status


@app.task(bind=True, name="silence-trim")
def silence_trim(_self, jobId: str, userId: str, _projectId: str, clipIds: list, options: dict = None):
    opts = options or {}
    silence_thresh_db = opts.get("silenceThreshDb", -40)
    min_silence_duration = opts.get("minSilenceDuration", 0.5)

    update_job_status(jobId, "processing", 5)

    with tempfile.TemporaryDirectory() as tmp:
        input_path = os.path.join(tmp, "input.mp4")
        output_path = os.path.join(tmp, "trimmed.mp4")

        download_clip(clipIds[0], userId, input_path)
        update_job_status(jobId, "processing", 20)

        y, sr = librosa.load(input_path, sr=None, mono=True)
        intervals = librosa.effects.split(
            y,
            top_db=abs(silence_thresh_db),
            frame_length=2048,
            hop_length=512,
        )

        # Build FFmpeg filter to keep only non-silent segments
        filter_parts = []
        concat_parts = []
        for i, (start, end) in enumerate(intervals):
            if (end - start) / sr < min_silence_duration:
                continue
            t_start = start / sr
            t_end = end / sr
            filter_parts.append(
                f"[0:v]trim=start={t_start:.3f}:end={t_end:.3f},setpts=PTS-STARTPTS[v{i}];"
                f"[0:a]atrim=start={t_start:.3f}:end={t_end:.3f},asetpts=PTS-STARTPTS[a{i}]"
            )
            concat_parts.append(f"[v{i}][a{i}]")

        update_job_status(jobId, "processing", 60)

        filter_complex = ";".join(filter_parts)
        n = len(concat_parts)
        filter_complex += f";{''.join(concat_parts)}concat=n={n}:v=1:a=1[outv][outa]"

        (
            ffmpeg
            .input(input_path)
            .output(output_path, filter_complex=filter_complex, map="[outv]", map_a="[outa]",
                    vcodec="libx264", acodec="aac", crf=18)
            .overwrite_output()
            .run(quiet=True)
        )

        update_job_status(jobId, "processing", 90)
        output_path_remote = upload_output(output_path, userId, jobId, "trimmed.mp4")

    update_job_status(jobId, "done", 100, output_path=output_path_remote)
    return {"jobId": jobId, "outputPath": output_path_remote}
