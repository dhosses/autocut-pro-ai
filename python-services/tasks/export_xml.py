import os
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime
from worker import app
from tasks._helpers import get_supabase, upload_output, update_job_status


def build_fcpxml(project_id: str, clips: list) -> str:
    """Build Final Cut Pro XML (FCPXML) compatible with Adobe Premiere Pro import."""
    root = ET.Element("fcpxml", version="1.9")

    resources = ET.SubElement(root, "resources")
    library = ET.SubElement(root, "library")
    event = ET.SubElement(library, "event", name="AutoCut Pro AI Export")
    project_el = ET.SubElement(event, "project", name=f"Project {project_id[:8]}")
    sequence = ET.SubElement(project_el, "sequence", format="r1")

    ET.SubElement(resources, "format", id="r1", name="FFVideoFormat1080p30",
                  frameDuration="1001/30000s", width="1920", height="1080")

    spine = ET.SubElement(sequence, "spine")
    offset = 0

    for i, clip in enumerate(clips):
        duration_frames = int(clip.get("duration_seconds", 10) * 30)
        duration_str = f"{duration_frames * 1001}/30000s"
        offset_str = f"{offset * 1001}/30000s"

        asset_id = f"r{i + 2}"
        ET.SubElement(resources, "asset", id=asset_id, name=clip.get("original_name", f"clip_{i}"),
                      src=clip.get("storage_path", ""), duration=duration_str)

        clip_el = ET.SubElement(spine, "clip", name=clip.get("original_name", f"clip_{i}"),
                                 offset=offset_str, duration=duration_str)
        ET.SubElement(clip_el, "asset-clip", ref=asset_id, offset="0s", duration=duration_str)

        offset += duration_frames

    return ET.tostring(root, encoding="unicode", xml_declaration=True)


@app.task(bind=True, name="export-xml")
def export_xml(self, jobId: str, userId: str, projectId: str, format: str = "fcpxml", **kwargs):
    update_job_status(jobId, "processing", 10)

    sb = get_supabase()
    clips_result = sb.table("clips").select("*").eq("project_id", projectId).execute()
    clips = clips_result.data or []

    update_job_status(jobId, "processing", 40)

    xml_content = build_fcpxml(projectId, clips)

    with tempfile.TemporaryDirectory() as tmp:
        xml_path = os.path.join(tmp, "export.fcpxml")
        with open(xml_path, "w", encoding="utf-8") as f:
            f.write(xml_content)

        update_job_status(jobId, "processing", 80)
        remote = upload_output(xml_path, userId, jobId, "export.fcpxml")

    update_job_status(jobId, "done", 100, output_path=remote)
    return {"jobId": jobId, "outputPath": remote}
