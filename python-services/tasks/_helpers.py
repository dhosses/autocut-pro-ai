import os
import requests
from supabase import create_client

_supabase = None

def get_supabase():
    global _supabase
    if _supabase is None:
        _supabase = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _supabase


def download_clip(clip_id: str, user_id: str, dest_path: str) -> None:
    sb = get_supabase()
    row = sb.table("clips").select("storage_path").eq("id", clip_id).single().execute()
    storage_path = row.data["storage_path"]
    signed = sb.storage.from_("raw-uploads").create_signed_url(storage_path, 300)
    response = requests.get(signed["signedURL"], stream=True)
    response.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)


def upload_output(local_path: str, user_id: str, job_id: str, filename: str) -> str:
    sb = get_supabase()
    remote_path = f"{user_id}/{job_id}/{filename}"
    with open(local_path, "rb") as f:
        sb.storage.from_("exports").upload(remote_path, f)
    return remote_path


def update_job_status(job_id: str, status: str, progress: int, output_path: str = None, error: str = None) -> None:
    sb = get_supabase()
    update = {
        "status": status,
        "progress": progress,
        "updated_at": "now()",
    }
    if output_path:
        update["output_path"] = output_path
    if error:
        update["error"] = error
    sb.table("jobs").update(update).eq("id", job_id).execute()
