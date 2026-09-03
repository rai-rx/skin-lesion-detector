from database import supabase
import uuid
from datetime import datetime, timezone

SIGNED_URL_TTL = 3600


def _timestamped_name(prefix: str, extension: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    return f"{prefix}_{timestamp}.{extension}"


def upload_scan_image(user_id: str, file_bytes: bytes, file_ext: str = "jpg") -> str:
    file_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    supabase.storage.from_("scan-images").upload(file_path, file_bytes, {"content-type": f"image/{file_ext}"})
    return supabase.storage.from_("scan-images").create_signed_url(file_path, SIGNED_URL_TTL)["signedURL"]

def upload_heatmap_image(user_id: str, file_bytes: bytes) -> str:
    file_path = f"{user_id}/{uuid.uuid4()}_heatmap.png"
    supabase.storage.from_("scan-images").upload(file_path, file_bytes, {"content-type": "image/png"})
    return supabase.storage.from_("scan-images").create_signed_url(file_path, SIGNED_URL_TTL)["signedURL"]

def upload_pdf_report(user_id: str, pdf_bytes: bytes) -> str:
    file_path = f"{user_id}/{_timestamped_name('report', 'pdf')}"
    supabase.storage.from_("pdf-reports").upload(file_path, pdf_bytes, {"content-type": "application/pdf"})
    return supabase.storage.from_("pdf-reports").create_signed_url(file_path, SIGNED_URL_TTL)["signedURL"]
