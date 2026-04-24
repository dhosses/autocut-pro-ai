import os
import tempfile
from openai import OpenAI
import ffmpeg
from worker import app
from tasks._helpers import download_clip, upload_output, update_job_status

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def seconds_to_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_srt(segments: list) -> str:
    lines = []
    for i, seg in enumerate(segments, 1):
        lines.append(str(i))
        lines.append(f"{seconds_to_srt_time(seg['start'])} --> {seconds_to_srt_time(seg['end'])}")
        lines.append(seg["text"].strip())
        lines.append("")
    return "\n".join(lines)


@app.task(bind=True, name="subtitles")
def subtitles(self, jobId: str, userId: str, projectId: str, clipIds: list, options: dict = None):
    opts = options or {}
    burn_in = opts.get("burnIn", False)
    language = opts.get("language", "en")

    update_job_status(jobId, "processing", 5)

    with tempfile.TemporaryDirectory() as tmp:
        input_path = os.path.join(tmp, "input.mp4")
        srt_path = os.path.join(tmp, "subtitles.srt")

        download_clip(clipIds[0], userId, input_path)
        update_job_status(jobId, "processing", 20)

        with open(input_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        srt_content = build_srt(transcript.segments)
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        update_job_status(jobId, "processing", 70)

        srt_remote = upload_output(srt_path, userId, jobId, "subtitles.srt")

        if burn_in:
            output_path = os.path.join(tmp, "with_subtitles.mp4")
            (
                ffmpeg
                .input(input_path)
                .output(output_path, vf=f"subtitles={srt_path}", vcodec="libx264", acodec="aac", crf=18)
                .overwrite_output()
                .run(quiet=True)
            )
            update_job_status(jobId, "processing", 95)
            video_remote = upload_output(output_path, userId, jobId, "with_subtitles.mp4")
            update_job_status(jobId, "done", 100, output_path=video_remote)
            return {"jobId": jobId, "srtPath": srt_remote, "videoPath": video_remote}

        update_job_status(jobId, "done", 100, output_path=srt_remote)
        return {"jobId": jobId, "srtPath": srt_remote}
