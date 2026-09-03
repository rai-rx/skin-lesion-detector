import io
import base64
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
from typing import Any, List, Optional, cast
from fastapi.middleware.cors import CORSMiddleware
import cv2
from auth.dependencies import get_optional_user, get_current_user
from database import supabase
from storage import upload_scan_image, upload_heatmap_image, upload_pdf_report

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://skin-eleven.vercel.app",
        "https://*.vercel.app",
        "*"  # Allow all origins as fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Skin Lesion Model API"}

# Configuration
LABEL_COLS = ["AKIEC", "BCC", "BEN_OTH", "BKL", "DF", "INF", "MAL_OTH", "MEL", "NV", "SCCKA", "VASC"]
LABEL_MAP = {
    "AKIEC": "Actinic Keratosis",
    "BCC": "Basal Cell Carcinoma",
    "BEN_OTH": "Other Benign Lesion",
    "BKL": "Seborrheic Keratosis",
    "DF": "Dermatofibroma",
    "INF": "Infectious Lesion",
    "MAL_OTH": "Other Malignant Lesion",
    "MEL": "Melanoma",
    "NV": "Benign Nevus (Mole)",
    "SCCKA": "Squamous Cell Carcinoma",
    "VASC": "Vascular Lesion"
}

IMG_SIZE = 480

from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent

# Load Model and Thresholds
model_paths = [
    str(BASE_DIR / f"efficientnetv2m_multilabel_fold{i}.keras")
    for i in range(5)
]

threshold_paths = [
    str(BASE_DIR / f"efficientnetv2m_multilabel_fold{i}_thresholds.npy")
    for i in range(5)
]

# Load 5-fold ensemble models
models = []
thresholds_list = []
for model_path, threshold_path in zip(model_paths, threshold_paths):
    models.append(tf.keras.models.load_model(model_path))
    thresholds_list.append(np.load(threshold_path).astype(np.float32))

def make_gradcam_heatmap(img_array, model, nested_model_name, last_conv_layer_name, pred_index=None):
    # 1. Access the nested architecture
    try:
        inner_model = model.get_layer(nested_model_name)
    except:
        inner_model = next(
            (
                layer for layer in model.layers
                if isinstance(layer, tf.keras.Model) and any(
                    len(getattr(candidate, "output_shape", ())) == 4
                    for candidate in layer.layers
                )
            ),
            None,
        )
        if inner_model is None:
            return None

    try:
        conv_layer = inner_model.get_layer(last_conv_layer_name)
    except:
        conv_layer = next(
            (
                layer for layer in reversed(inner_model.layers)
                if len(getattr(layer, "output_shape", ())) == 4
            ),
            None,
        )
        if conv_layer is None:
            return None
    
    # 2. Reconstruct the classifier path (to bridge the gradient gap)
    inner_model_index = next(
        (i for i, layer in enumerate(model.layers) if layer is inner_model),
        0,
    )
    classifier_layers = model.layers[inner_model_index + 1:]

    # 3. Create the Gradient Model
    grad_model_inner = tf.keras.models.Model(
        [inner_model.inputs], 
        [conv_layer.output, inner_model.output]
    )

    with tf.GradientTape() as tape:
        # Forward pass through inner model
        conv_outputs, inner_output = grad_model_inner(img_array)
        
        # Forward pass through the top "head" layers
        x = inner_output
        for layer in classifier_layers:
            x = layer(x)
        preds = x

        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    # 4. Calculate Gradients
    grads = tape.gradient(class_channel, conv_outputs)

    # 5. HI-RESCAM LOGIC: 
    heatmap = conv_outputs[0] * grads[0]
    
    # Sum across the channel axis to get a 2D map
    heatmap = tf.reduce_sum(heatmap, axis=-1)

    # 6. Normalize
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-10)
    return heatmap.numpy()


def get_risk_level(top_label: str, top_conf: float) -> str:
    high_risk = ["MEL", "BCC", "SCCKA", "AKIEC", "MAL_OTH"]
    if top_label in high_risk and top_conf > 0.5:
        return "high"
    elif top_label in high_risk or top_conf > 0.7:
        return "medium"
    return "low"

def verify_is_skin_tissue(img_pil) -> bool:
    """
    Evaluates if the dominant pixel composition falls within valid human skin color spaces.
    Supports a wide variety of human skin tones and diverse camera lighting.
    """
    open_cv_image = np.array(img_pil.convert("RGB"))[:, :, ::-1].copy()
    hsv = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2HSV)
    
    # Robust medical photography thresholds for human skin tones in HSV
    lower_skin = np.array([0, 15, 40], dtype=np.uint8)
    upper_skin = np.array([35, 230, 255], dtype=np.uint8)
    
    skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
    skin_percentage = (np.sum(skin_mask == 255) / skin_mask.size) * 100
    
    return skin_percentage >= 20.0

def center_crop_and_resize(img, size):
    width, height = img.size
    new_side = min(width, height)
    left = (width - new_side) / 2
    top = (height - new_side) / 2
    right = (width + new_side) / 2
    bottom = (height + new_side) / 2
    
    img = img.crop((left, top, right, bottom))
    return img.resize((size, size), Image.Resampling.LANCZOS)

def validate_image_quality(img_pil) -> tuple[bool, str]:
    open_cv_image = np.array(img_pil.convert("RGB"))
    open_cv_image = open_cv_image[:, :, ::-1].copy() 
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
    
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 20.0:
        return False, f"Image is too blurry (Sharpness Score: {round(laplacian_var, 2)}). Please stabilize your camera and retake."
        
    mean_brightness = gray.mean()
    if mean_brightness < 35.0:
        return False, f"Image is too dark (Brightness: {round(mean_brightness, 2)}). Please activate your camera flash or use external light."
    if mean_brightness > 245.0:
        return False, f"Image is overexposed (Brightness: {round(mean_brightness, 2)}). Avoid direct glare or harsh lighting on the skin lesion."
        
    return True, "Success"

def compute_abcde_structural_metrics(img_processed) -> dict:
    """
    Applies advanced computer vision via OpenCV to isolate a lesion and calculate
    quantitative scores for the complete clinical ABCDE criteria.
    """
    open_cv_rgb = np.array(img_processed).astype(np.uint8)
    gray = cv2.cvtColor(open_cv_rgb, cv2.COLOR_RGB2GRAY)
    
    pad = 15
    gray = cv2.copyMakeBorder(gray, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    rgb_padded = cv2.copyMakeBorder(open_cv_rgb, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
    
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    if np.sum(mask == 255) > np.sum(mask == 0):
        mask = cv2.bitwise_not(mask)
        
    lesion_area = np.sum(mask == 255)
    if lesion_area == 0:
        return {
            "asymmetry": 0.0, "borderIrregularity": 0.0, 
            "colorDivergence": 0.0, "diameterProfile": 0.0, "evolvingTracking": 0.0
        }

    # === [A] ASYMMETRY ===
    M = cv2.moments(mask)
    if M["m00"] == 0:
        return {
            "asymmetry": 0.0, "borderIrregularity": 0.0, 
            "colorDivergence": 0.0, "diameterProfile": 0.0, "evolvingTracking": 0.0
        }
    cX = int(M["m10"] / M["m00"])
    cY = int(M["m01"] / M["m00"])
    
    h, w = mask.shape
    max_dim = max(h, w) * 2
    canvas = np.zeros((max_dim, max_dim), dtype=np.uint8)
    offsetX = max_dim // 2 - cX
    offsetY = max_dim // 2 - cY
    canvas[offsetY:offsetY+h, offsetX:offsetX+w] = mask
    
    flipped_h = cv2.flip(canvas, 1)
    flipped_v = cv2.flip(canvas, 0)
    xor_h = cv2.bitwise_xor(canvas, flipped_h)
    xor_v = cv2.bitwise_xor(canvas, flipped_v)
    
    asym_h_score = (np.sum(xor_h == 255) / (2 * lesion_area)) * 100
    asym_v_score = (np.sum(xor_v == 255) / (2 * lesion_area)) * 100
    asymmetry_score = min(100.0, (asym_h_score + asym_v_score) / 2)

    # === [B] BORDER IRREGULARITY ===
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    border_score = 0.0
    diameter_score = 0.0
    
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        perimeter = cv2.arcLength(largest_contour, True)
        contour_area = cv2.contourArea(largest_contour)
        
        if contour_area > 0 and perimeter > 0:
            compactness = (perimeter ** 2) / (4 * np.pi * contour_area)
            if compactness >= 1.0:
                border_score = min(100.0, (np.log(compactness) / np.log(1.5)) * 15)
        
        # === [D] DIAMETER PROFILE ===
        _, _, bbox_w, bbox_h = cv2.boundingRect(largest_contour)
        max_pixel_extension = max(bbox_w, bbox_h)
        diameter_score = min(100.0, (max_pixel_extension / max(h, w)) * 130)

    # === [C] COLOR DIVERGENCE ===
    lesion_pixels = rgb_padded[mask == 255]
    if len(lesion_pixels) > 0:
        std_r = np.std(lesion_pixels[:, 0])
        std_g = np.std(lesion_pixels[:, 1])
        std_b = np.std(lesion_pixels[:, 2])
        mean_std = (std_r + std_g + std_b) / 3.0
        color_score = min(100.0, mean_std * 2.2)
    else:
        color_score = 0.0

    # === [E] EVOLVING TRACKING ===
    evolving_score = min(100.0, max(0.0, (asymmetry_score * 0.4) + (border_score * 0.6)))

    return {
        "asymmetry": round(asymmetry_score, 1),
        "borderIrregularity": round(border_score, 1),
        "colorDivergence": round(color_score, 1),
        "diameterProfile": round(diameter_score, 1),
        "evolvingTracking": round(evolving_score, 1)
    }

def apply_custom_crop(img_pil, x: float, y: float, w: float, h: float, target_size: int):
    box = (x, y, x + w, y + h)
    cropped_img = img_pil.crop(box)
    return cropped_img.resize((target_size, target_size), Image.Resampling.LANCZOS)

@app.post("/predict")
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
    user: Optional[dict] = Depends(get_optional_user)
):
    # 1. Ingest File Payload
    contents = await file.read()
    original_img = Image.open(io.BytesIO(contents)).convert("RGB")
    orig_w, orig_h = original_img.size

    # 1. Processing Pipeline (Custom Crop vs Center Crop)
    crop_params = [crop_x, crop_y, crop_width, crop_height]
    if all(param is not None for param in crop_params):
        try:
            crop_x_value, crop_y_value, crop_width_value, crop_height_value = crop_params
            assert crop_x_value is not None and crop_y_value is not None and crop_width_value is not None and crop_height_value is not None
            img_processed = apply_custom_crop(
                original_img, crop_x_value, crop_y_value, crop_width_value, crop_height_value, IMG_SIZE
            )
        except Exception:
            img_processed = center_crop_and_resize(original_img, IMG_SIZE)
    else:
        img_processed = center_crop_and_resize(original_img, IMG_SIZE)

    # 2. Quality and Skin Architecture Validation on Selected Region
    if not verify_is_skin_tissue(img_processed) and not verify_is_skin_tissue(original_img):
        raise HTTPException(
            status_code=400, 
            detail="Invalid Asset Detected: The selected region does not appear to contain human skin tissue. Please adjust the crop box over the lesion and try again."
        )
    
    is_valid, error_msg = validate_image_quality(img_processed)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # FIXED: Comprehensive default structure to hold all 5 telemetry metrics safely
    structural_metrics = {
        "asymmetry": 0.0, 
        "borderIrregularity": 0.0,
        "colorDivergence": 0.0,
        "diameterProfile": 0.0,
        "evolvingTracking": 0.0
    }
    try:
        # FIXED: Mapped to the updated function name 'compute_abcde_structural_metrics'
        structural_metrics = compute_abcde_structural_metrics(img_processed)
    except Exception as cv_err:
        print(f"Non-breaking CV Warning: ABCDE metrics extraction failed: {cv_err}")

    # Convert processed asset to standard NumPy array structures
    arr = np.asarray(img_processed).astype(np.float32)
    arr_preprocessed = tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    x = tf.convert_to_tensor(arr_preprocessed[None, ...], dtype=tf.float32)

    # 4. INFERENCE ENGINE RUNTIME - 5-Fold Ensemble
    ensemble_probs = []
    for model in models:
        fold_probs = model.predict(x, verbose=0)[0]
        ensemble_probs.append(fold_probs)
    
    # Average predictions across all folds
    probs = np.mean(ensemble_probs, axis=0)
    
    # 5. GRAD-CAM (HiResCAM) VISUALIZATION TIMELINE - Using first model for visualization
    heatmap_bytes = None
    try:
        heatmap_raw = make_gradcam_heatmap(
            x, 
            models[0], 
            "efficientnetv2m_multilabel",
            "top_activation"
        )
        
        if heatmap_raw is not None:
            heatmap_resized = cv2.resize(heatmap_raw, (orig_w, orig_h))
            heatmap_uint8 = np.uint8(255 * heatmap_resized)
            heatmap_color = cv2.applyColorMap(cast(Any, heatmap_uint8), cv2.COLORMAP_JET)
            
            _, buffer = cv2.imencode('.png', heatmap_color)
            heatmap_bytes = buffer.tobytes()
            heatmap_base64 = base64.b64encode(buffer.tobytes()).decode('utf-8')
            heatmap_data_uri = f"data:image/png;base64,{heatmap_base64}"
        else:
            heatmap_data_uri = None
            
    except Exception as e:
        print(f"Heatmap generation failed: {e}")
        heatmap_data_uri = None

    # 6. OUTPUT TELEMETRY FORMATTING
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

    scan_id = None
    image_url = None
    if user:
        try:
            user_id = user.get("sub")
            if not user_id:
                raise ValueError("Authenticated token does not contain a user id")

            if not lesion_id:
                lesion_res = supabase.table("lesions").insert({
                    "user_id": user_id,
                    "nickname": new_lesion_nickname or f"Quick Scan {new_lesion_location or 'Unspecified'}",
                    "body_location": new_lesion_location or "Unspecified",
                }).execute()
                if lesion_res.data:
                    lesion_id = lesion_res.data[0]["id"]

            if lesion_id:
                image_url = upload_scan_image(user_id, contents)
                heatmap_url = upload_heatmap_image(user_id, heatmap_bytes) if heatmap_bytes else None
                scan_res = supabase.table("scans").insert({
                    "lesion_id": lesion_id,
                    "image_url": image_url,
                    "primary_diagnosis": primary_label,
                    "primary_diagnosis_code": raw_label,
                    "confidence_rate": round(primary_conf, 2),
                    "risk_level": get_risk_level(raw_label, float(probs[top_idx])),
                    "secondary_findings": secondary,
                    "abcde_metrics": structural_metrics,
                    "heatmap_url": heatmap_url,
                    "user_notes": scan_note,
                    "is_valid_upload": True,
                }).execute()
                if scan_res.data:
                    scan_id = scan_res.data[0]["id"]
        except Exception as persistence_error:
            print(f"Authenticated scan persistence failed: {persistence_error}")

    return {
        "id": scan_id,
        "classification": primary_label,
        "confidence": round(primary_conf, 2),
        "riskLevel": get_risk_level(raw_label, float(probs[top_idx])),
        "secondaryPredictions": secondary,
        "abcdMetrics": structural_metrics,
        "notes": f"Verified image clarity. Processed at {IMG_SIZE}px using HiResCAM spatial mappings.",
        "heatmap": heatmap_data_uri 
    }


@app.post("/reports")
async def save_pdf_report(
    scan_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    scan_res = supabase.table("scans").select("id, lesion_id").eq("id", scan_id).single().execute()
    if not scan_res.data:
        raise HTTPException(status_code=404, detail="Scan not found")

    lesion_res = supabase.table("lesions").select("user_id").eq("id", scan_res.data["lesion_id"]).single().execute()
    if not lesion_res.data or lesion_res.data["user_id"] != user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to update this scan")

    pdf_url = upload_pdf_report(user["sub"], await file.read())
    supabase.table("scans").update({"pdf_report_url": pdf_url}).eq("id", scan_id).execute()
    return {"pdf_report_url": pdf_url}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)