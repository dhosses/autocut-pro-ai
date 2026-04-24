import os
import tempfile
import cv2
import ffmpeg
from worker import app
from tasks._helpers import download_clip, upload_output, update_job_status


def detect_face_center(frame) -> tuple[int, int] | None:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    classifier = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = classifier.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    if len(faces) == 0:
        return None
    x, y, w, h = faces[0]
    return (x + w // 2, y + h // 2)


@app.task(bind=True, name="tracking")
def tracking(self, jobId: str, userId: str, projectId: str, clipIds: list, options: dict = None):
    opts = options or {}
    target_ratio = opts.get("aspectRatio", "9:16")  # vertical by default
    sample_fps = opts.get("sampleFps", 2)

    update_job_status(jobId, "processing", 5)

    with tempfile.TemporaryDirectory() as tmp:
        input_path = os.path.join(tmp, "input.mp4")
        output_path = os.path.join(tmp, "tracked.mp4")
        download_clip(clipIds[0], userId, input_path)
        update_job_status(jobId, "processing", 20)

        cap = cv2.VideoCapture(input_path)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)

        # Determine crop dimensions for target ratio
        ratio_w, ratio_h = map(int, target_ratio.split(":"))
        crop_h = height
        crop_w = int(height * ratio_w / ratio_h)
        if crop_w > width:
            crop_w = width
            crop_h = int(width * ratio_h / ratio_w)

        centers = []
        frame_idx = 0
        sample_every = max(1, int(fps / sample_fps))

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % sample_every == 0:
                center = detect_face_center(frame)
                centers.append(center)
            frame_idx += 1

        cap.release()

        # Smooth center x using a running average
        xs = [c[0] if c else width // 2 for c in centers]
        smooth_x = int(sum(xs) / len(xs)) if xs else width // 2
        crop_x = max(0, min(smooth_x - crop_w // 2, width - crop_w))
        crop_y = max(0, (height - crop_h) // 2)

        update_job_status(jobId, "processing", 70)

        (
            ffmpeg
            .input(input_path)
            .crop(crop_x, crop_y, crop_w, crop_h)
            .output(output_path, vcodec="libx264", acodec="aac", crf=18)
            .overwrite_output()
            .run(quiet=True)
        )

        update_job_status(jobId, "processing", 90)
        remote = upload_output(output_path, userId, jobId, "tracked.mp4")

    update_job_status(jobId, "done", 100, output_path=remote)
    return {"jobId": jobId, "outputPath": remote}
