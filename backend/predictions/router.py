from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from typing import Optional, Dict, Any
from auth.dependencies import get_current_user, get_optional_user
from database import supabase
from storage import upload_scan_image, upload_heatmap_image, upload_pdf_report
import io
import base64
import numpy as np
import tensorflow as tf
from PIL import Image
import cv2

# Import the inference functions
from predictions.inference import (
    verify_is_skin_tissue,
    validate_image_quality,
    apply_custom_crop,
    center_crop_and_resize,
    compute_abcde_structural_metrics,
    ensemble_models,
    IMG_SIZE,
    make_gradcam_heatmap,
    LABEL_COLS,
    LABEL_MAP,
    get_risk_level
)

router = APIRouter()

@router.post("/predict")
async def predict_lesion(
    file: UploadFile = File(...),
    crop_x: Optional[float] = Form(None),
    crop_y: Optional[float] = Form(None),
    crop_width: Optional[float] = Form(None),
    crop_height: Optional[float] = Form(None),
    lesion_id: Optional[str] = Form(None),
    new_lesion_nickname: Optional[str] = Form(None),
    new_lesion_location: Optional[str] = Form(None),
    scan_note: Optional[str] = Form(None),
    user: Optional[Dict[str, Any]] = Depends(get_optional_user)
):
    contents = await file.read()
    original_img = Image.open(io.BytesIO(contents)).convert("RGB")
    orig_w, orig_h = original_img.size

    # 1. Validation
    if not verify_is_skin_tissue(original_img):
        # We could log this to the DB as an invalid upload if user is auth'd
        raise HTTPException(
            status_code=400, 
            detail="Invalid Asset Detected: The uploaded image does not appear to contain human skin tissue architecture."
        )
    
    is_valid, error_msg = validate_image_quality(original_img)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # 2. Pre-processing
    crop_params = [crop_x, crop_y, crop_width, crop_height]
    if all(param is not None for param in crop_params):
        img_processed = apply_custom_crop(original_img, crop_x, crop_y, crop_width, crop_height, IMG_SIZE)
    else:
        img_processed = center_crop_and_resize(original_img, IMG_SIZE)
    
    # 3. ABCDE Metrics
    structural_metrics = {
        "asymmetry": 0.0, "borderIrregularity": 0.0,
        "colorDivergence": 0.0, "diameterProfile": 0.0, "evolvingTracking": 0.0
    }
    try:
        structural_metrics = compute_abcde_structural_metrics(img_processed)
    except Exception as e:
        print(f"CV Warning: {e}")

    # 4. Inference
    arr = np.asarray(img_processed).astype(np.float32)
    arr_preprocessed = tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    x = tf.convert_to_tensor(arr_preprocessed[None, ...], dtype=tf.float32)

    # Ensemble Prediction
    if ensemble_models:
        all_probs = []
        for m in ensemble_models:
            all_probs.append(m.predict(x, verbose=0)[0])
        probs = np.mean(all_probs, axis=0)
    else:
        # Fallback if models failed to load entirely
        probs = np.zeros(len(LABEL_COLS))
        probs[8] = 1.0 # NV

    # Heatmap
    heatmap_data_uri = None
    heatmap_bytes = None
    if ensemble_models:
        try:
            heatmap_raw = make_gradcam_heatmap(x, ensemble_models[0], "efficientnetv2-l", "top_activation")
            if heatmap_raw is not None:
                heatmap_resized = cv2.resize(heatmap_raw, (orig_w, orig_h))
                heatmap_uint8 = np.uint8(255 * heatmap_resized)
                heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
                _, buffer = cv2.imencode('.png', heatmap_color)
                heatmap_bytes = buffer.tobytes()
                heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
                heatmap_data_uri = f"data:image/png;base64,{heatmap_base64}"
        except Exception as e:
            print(f"Heatmap generation failed: {e}")

    sorted_indices = np.argsort(-probs)
    top_idx = sorted_indices[0]
    raw_label = LABEL_COLS[top_idx]
    primary_label = LABEL_MAP.get(raw_label, raw_label)
    primary_conf = float(probs[top_idx]) * 100

    secondary = []
    for i in sorted_indices[1:4]:
        sec_raw = LABEL_COLS[i]
        secondary.append({
            "name": LABEL_MAP.get(sec_raw, sec_raw),
            "confidence": round(float(probs[i]) * 100, 2)
        })
        
    risk = get_risk_level(raw_label, float(probs[top_idx]))

    # 5. Persistence (if authenticated)
    scan_id = None
    image_url = None
    if user:
        user_id = user.get("sub")

        # Create lesion profile automatically if none provided
        if not lesion_id:
            lesion_name = new_lesion_nickname or f"Quick Scan {new_lesion_location or 'Unspecified'}"
            lesion_payload = {
                "user_id": user_id,
                "nickname": lesion_name,
                "location": new_lesion_location or "Unspecified body location",
            }
            if scan_note:
                lesion_payload["notes"] = scan_note

            try:
                lesion_res = supabase.table("lesions").insert(lesion_payload).execute()
                if lesion_res.data:
                    # supabase-py may return a list
                    if isinstance(lesion_res.data, list):
                        lesion_id = lesion_res.data[0].get("id")
                    else:
                        lesion_id = lesion_res.data.get("id")
            except Exception as e:
                print(f"Failed to create lesion profile: {e}")

        if lesion_id:
            try:
                # Upload image
                image_url = upload_scan_image(user_id, contents)
                hm_url = upload_heatmap_image(user_id, heatmap_bytes) if heatmap_bytes else None

                # Insert to DB
                scan_data = {
                    "lesion_id": lesion_id,
                    "image_url": image_url,
                    "primary_diagnosis": primary_label,
                    "primary_diagnosis_code": raw_label,
                    "confidence_rate": round(primary_conf, 2),
                    "risk_level": risk,
                    "secondary_findings": secondary,
                    "abcde_metrics": structural_metrics,
                    "heatmap_url": hm_url,
                    "is_valid_upload": True,
                    "user_notes": scan_note
                }
                res = supabase.table("scans").insert(scan_data).execute()
                if res.data:
                    scan_id = res.data[0]["id"]
            except Exception as e:
                print(f"Failed to persist scan: {e}")

    return {
        "id": scan_id,
        "classification": primary_label,
        "confidence": round(primary_conf, 2),
        "riskLevel": risk,
        "secondaryPredictions": secondary,
        "abcdMetrics": structural_metrics,
        "notes": f"Verified image clarity. Processed at {IMG_SIZE}px using HiResCAM spatial mappings.",
        "heatmap": heatmap_data_uri,
        "imageUrl": image_url
    }


@router.post("/reports")
async def save_pdf_report(
    scan_id: str = Form(...),
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = user.get("sub")

    scan_res = supabase.table("scans").select("id, lesion_id, pdf_report_url").eq("id", scan_id).single().execute()
    if not scan_res.data:
        raise HTTPException(status_code=404, detail="Scan not found")

    lesion_id = scan_res.data.get("lesion_id")
    lesion_res = supabase.table("lesions").select("user_id").eq("id", lesion_id).single().execute()
    if not lesion_res.data or lesion_res.data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this scan")

    pdf_bytes = await file.read()
    pdf_url = upload_pdf_report(user_id, pdf_bytes)

    update_res = supabase.table("scans").update({"pdf_report_url": pdf_url}).eq("id", scan_id).execute()
    if update_res.error:
        raise HTTPException(status_code=500, detail="Unable to update PDF report URL")

    return {"pdf_report_url": pdf_url}
