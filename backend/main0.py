import io
import base64
import numpy as np
import tensorflow as tf
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you can allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Load Model and Thresholds
model = tf.keras.models.load_model("efficientnetv2l_multilabel_fold4.keras")
thresholds = np.load("efficientnetv2l_multilabel_final_thresholds.npy").astype(np.float32)

def make_gradcam_heatmap(img_array, model, nested_model_name, last_conv_layer_name, pred_index=None):
    # 1. Access the nested architecture
    inner_model = model.get_layer(nested_model_name)
    
    # 2. Reconstruct the classifier path (to bridge the gradient gap)
    inner_model_index = 0
    for i, layer in enumerate(model.layers):
        if layer.name == nested_model_name:
            inner_model_index = i
            break
    classifier_layers = model.layers[inner_model_index + 1:]

    # 3. Create the Gradient Model
    grad_model_inner = tf.keras.models.Model(
        [inner_model.inputs], 
        [inner_model.get_layer(last_conv_layer_name).output, inner_model.output]
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
    # Instead of averaging (pooling) the gradients, we multiply element-wise
    # This keeps the visualization much sharper and more localized.
    # Result = Element-wise (Feature Map * Gradient)
    heatmap = conv_outputs[0] * grads[0]
    
    # Sum across the channel axis to get a 2D map
    heatmap = tf.reduce_sum(heatmap, axis=-1)

    # 6. Normalize
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-10)
    return heatmap.numpy()


def get_risk_level(top_label: str, top_conf: float) -> str:
    # Logic to map labels to risk levels
    high_risk = ["MEL", "BCC", "SCCKA", "AKIEC", "MAL_OTH"]
    if top_label in high_risk and top_conf > 0.5:
        return "high"
    elif top_label in high_risk or top_conf > 0.7:
        return "medium"
    return "low"

def center_crop_and_resize(img, size):
    width, height = img.size
    # Find the shortest side to make a perfect square
    new_side = min(width, height)
    left = (width - new_side) / 2
    top = (height - new_side) / 2
    right = (width + new_side) / 2
    bottom = (height + new_side) / 2
    
    # 1. Crop to square
    img = img.crop((left, top, right, bottom))
    # 2. Resize with high-quality filter
    return img.resize((size, size), Image.Resampling.LANCZOS)

from fastapi import HTTPException, Form  # Ensure Form and HTTPException are imported

def validate_image_quality(img_pil) -> tuple[bool, str]:
    """
    Checks if the uploaded image meets clinical quality benchmarks for sharpness and exposure.
    Returns (is_valid, error_message).
    """
    # Convert PIL Image to OpenCV Grayscale format
    open_cv_image = np.array(img_pil.convert("RGB"))
    open_cv_image = open_cv_image[:, :, ::-1].copy() # Convert RGB to BGR
    gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur Detection (Variance of Laplacian)
    # Lower values mean smoother edges, indicating a blurry image.
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 80.0:  # Threshold adjusted for macro skin photography
        return False, f"Image is too blurry (Sharpness Score: {round(laplacian_var, 2)}). Please stabilize your camera and retake."
        
    # 2. Exposure / Lighting Verification
    # Measures the average brightness across all pixels (Scale 0-255)
    mean_brightness = gray.mean()
    if mean_brightness < 45.0:
        return False, f"Image is too dark (Brightness: {round(mean_brightness, 2)}). Please activate your camera flash or use external light."
    if mean_brightness > 230.0:
        return False, f"Image is overexposed (Brightness: {round(mean_brightness, 2)}). Avoid direct glare or harsh lighting on the skin lesion."
        
    return True, "Success"

def compute_abcd_structural_metrics(img_processed) -> dict:
    """
    Applies classic digital image processing via OpenCV to isolate the lesion
    and calculate quantitative Asymmetry and Border Irregularity scores.
    """
    # 1. Convert processed PIL image directly to an OpenCV grayscale uint8 frame
    open_cv_rgb = np.array(img_processed).astype(np.uint8)
    gray = cv2.cvtColor(open_cv_rgb, cv2.COLOR_RGB2GRAY)
    
    # 2. Smooth noise and segment via Otsu's thresholding
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Invariant check: Ensure the lesion is targeted (white object on dark canvas background)
    if np.sum(mask == 255) > np.sum(mask == 0):
        mask = cv2.bitwise_not(mask)
        
    lesion_area = np.sum(mask == 255)
    if lesion_area == 0:
        return {"asymmetry": 0.0, "borderIrregularity": 0.0}

    # 3. ASYMMETRY: Compute geometric center of mass (Spatial Moments)
    M = cv2.moments(mask)
    if M["m00"] == 0:
        return {"asymmetry": 0.0, "borderIrregularity": 0.0}
    cX = int(M["m10"] / M["m00"])
    cY = int(M["m01"] / M["m00"])
    
    # Map the mask onto an extended canvas to prevent edge clipping during rotational flips
    h, w = mask.shape
    max_dim = max(h, w) * 2
    canvas = np.zeros((max_dim, max_dim), dtype=np.uint8)
    offsetX = max_dim // 2 - cX
    offsetY = max_dim // 2 - cY
    canvas[offsetY:offsetY+h, offsetX:offsetX+w] = mask
    
    # Mirror the lesion canvas along horizontal and vertical axes
    flipped_h = cv2.flip(canvas, 1)
    flipped_v = cv2.flip(canvas, 0)
    
    # Quantify non-overlapping spatial regions using a bitwise XOR execution loop
    xor_h = cv2.bitwise_xor(canvas, flipped_h)
    xor_v = cv2.bitwise_xor(canvas, flipped_v)
    
    asym_h_score = (np.sum(xor_h == 255) / (2 * lesion_area)) * 100
    asym_v_score = (np.sum(xor_v == 255) / (2 * lesion_area)) * 100
    asymmetry_score = min(100.0, (asym_h_score + asym_v_score) / 2)

    # 4. BORDER IRREGULARITY: Mathematical Compactness Ratio
    # Compactness equation:
    # $$\text{Compactness} = \frac{P^2}{4\pi A}$$
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        perimeter = cv2.arcLength(largest_contour, True)
        contour_area = cv2.contourArea(largest_contour)
        
        if contour_area > 0 and perimeter > 0:
            compactness = (perimeter ** 2) / (4 * np.pi * contour_area)
            # Normalize to an accessible 0-100 baseline. Perfect smooth circles evaluate to 0.
            border_score = min(100.0, max(0.0, (compactness - 1.0) * 30))
        else:
            border_score = 0.0
    else:
        border_score = 0.0

    return {
        "asymmetry": round(asymmetry_score, 1),
        "borderIrregularity": round(border_score, 1)
    }

def apply_custom_crop(img_pil, x: float, y: float, w: float, h: float, target_size: int):
    """
    Crops the original image using user-defined coordinates from a frontend cropper,
    then normalizes the output to the required model input size.
    """
    box = (x, y, x + w, y + h)
    cropped_img = img_pil.crop(box)
    return cropped_img.resize((target_size, target_size), Image.Resampling.LANCZOS)

@app.post("/predict")
async def predict_lesion(
    file: UploadFile = File(...),
    crop_x: Optional[float] = Form(None),
    crop_y: Optional[float] = Form(None),
    crop_width: Optional[float] = Form(None),
    crop_height: Optional[float] = Form(None)
):
    # 1. Ingest File Payload
    contents = await file.read()
    original_img = Image.open(io.BytesIO(contents)).convert("RGB")
    orig_w, orig_h = original_img.size
    
    # 2. RUN ON-THE-FLY QUALITY VALIDATION
    # Intercepts poor clinical data payloads early to preserve compute resources
    is_valid, error_msg = validate_image_quality(original_img)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # 3. PROCESSING PIPELINE (Dynamic vs. Fallback Center Crop)
    # Check if all four cropping coordinates were provided by the client application
    crop_params = [crop_x, crop_y, crop_width, crop_height]
    if all(param is not None for param in crop_params):
        img_processed = apply_custom_crop(
            original_img, crop_x, crop_y, crop_width, crop_height, IMG_SIZE
        )
    else:
        # Default back to standard behavior if user skipped manual cropping
        img_processed = center_crop_and_resize(original_img, IMG_SIZE)
        structural_metrics = compute_abcd_structural_metrics(img_processed)
    
    # Convert processed asset to standard NumPy array structures
    arr = np.asarray(img_processed).astype(np.float32)
    arr_preprocessed = tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    x = tf.convert_to_tensor(arr_preprocessed[None, ...], dtype=tf.float32)

    # 4. INFERENCE ENGINE RUNTIME
    probs = model.predict(x, verbose=0)[0]
    
    # 5. GRAD-CAM (HiResCAM) VISUALIZATION TIMELINE
    try:
        heatmap_raw = make_gradcam_heatmap(
            x, 
            model, 
            "efficientnetv2-l", 
            "top_activation"
        )
        
        if heatmap_raw is not None:
            # Resize heatmap back to match original image proportions for UI overlay alignment
            heatmap_resized = cv2.resize(heatmap_raw, (orig_w, orig_h))
            heatmap_uint8 = np.uint8(255 * heatmap_resized)
            heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            
            _, buffer = cv2.imencode('.png', heatmap_color)
            heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
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
    for i in sorted_indices[1:7]:
        sec_raw = LABEL_COLS[i]
        secondary.append({
            "name": LABEL_MAP.get(sec_raw, sec_raw),
            "confidence": round(float(probs[i]) * 100, 2)
        })

    return {
        "classification": primary_label,
        "confidence": round(primary_conf, 2),
        "riskLevel": get_risk_level(raw_label, float(probs[top_idx])),
        "secondaryPredictions": secondary,
        "abcdMetrics": structural_metrics,
        "notes": f"Verified image clarity. Processed at {IMG_SIZE}px using HiResCAM spatial mappings.",
        "heatmap": heatmap_data_uri 
    }


if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to make sure it's accessible locally
    uvicorn.run(app, host="0.0.0.0", port=8000)