from celery import Celery
from dotenv import load_dotenv
import os

load_dotenv()

app = Celery(
    "autocut",
    broker=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    include=[
        "tasks.silence_trim",
        "tasks.subtitles",
        "tasks.sync",
        "tasks.tracking",
        "tasks.export_xml",
    ],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
)

if __name__ == "__main__":
    app.start()
