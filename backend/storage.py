from database import supabase
import uuid
from datetime import datetime, timezone

STORAGE_BUCKETS = ("scan-images", "pdf-reports")


def ensure_storage_buckets() -> None:
    existing = {bucket.name for bucket in supabase.storage.list_buckets()}
    for bucket_name in STORAGE_BUCKETS:
        if bucket_name not in existing:
            supabase.storage.create_bucket(bucket_name, bucket_name, {"public": True})


def _upload(bucket_name: str, file_path: str, file_bytes: bytes, content_type: str) -> str:
    ensure_storage_buckets()
    try:
        supabase.storage.from_(bucket_name).upload(
            file_path,
            file_bytes,
            {"content-type": content_type},
        )
    except Exception as error:
        if "bucket not found" not in str(error).lower() and "nosuchbucket" not in str(error).lower():
            raise
        ensure_storage_buckets()
        supabase.storage.from_(bucket_name).upload(
            file_path,
            file_bytes,
            {"content-type": content_type},
        )
    return supabase.storage.from_(bucket_name).get_public_url(file_path)


def _timestamped_name(prefix: str, extension: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    return f"{prefix}_{timestamp}.{extension}"


def upload_scan_image(user_id: str, file_bytes: bytes, file_ext: str = "jpg") -> str:
    file_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    return _upload("scan-images", file_path, file_bytes, f"image/{file_ext}")

def upload_heatmap_image(user_id: str, file_bytes: bytes) -> str:
    file_path = f"{user_id}/{uuid.uuid4()}_heatmap.png"
    return _upload("scan-images", file_path, file_bytes, "image/png")

def upload_pdf_report(user_id: str, pdf_bytes: bytes) -> str:
    file_path = f"{user_id}/{_timestamped_name('report', 'pdf')}"
    return _upload("pdf-reports", file_path, pdf_bytes, "application/pdf")
