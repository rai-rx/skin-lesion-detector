from database import supabase
import uuid

def upload_scan_image(user_id: str, file_bytes: bytes, file_ext: str = "jpg") -> str:
    file_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    res = supabase.storage.from_("scan-images").upload(file_path, file_bytes, {"content-type": f"image/{file_ext}"})
    # Get public URL
    return supabase.storage.from_("scan-images").get_public_url(file_path)

def upload_heatmap_image(user_id: str, file_bytes: bytes) -> str:
    file_path = f"{user_id}/{uuid.uuid4()}_heatmap.png"
    res = supabase.storage.from_("scan-images").upload(file_path, file_bytes, {"content-type": "image/png"})
    return supabase.storage.from_("scan-images").get_public_url(file_path)

def upload_pdf_report(user_id: str, pdf_bytes: bytes) -> str:
    file_path = f"{user_id}/report_{uuid.uuid4()}.pdf"
    res = supabase.storage.from_("pdf-reports").upload(file_path, pdf_bytes, {"content-type": "application/pdf"})
    return supabase.storage.from_("pdf-reports").get_public_url(file_path)
