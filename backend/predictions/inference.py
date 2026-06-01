import io
import base64
import numpy as np
import tensorflow as tf
from PIL import Image
import cv2

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

MODEL_PATHS = [
    "efficientnetv2l_multilabel_fold1.keras",
    "efficientnetv2l_multilabel_fold2.keras",
    "efficientnetv2l_multilabel_fold3.keras",
    "efficientnetv2l_multilabel_fold4.keras",
    "efficientnetv2l_multilabel_fold5.keras"
]

print("Loading ensemble models...")
try:
    ensemble_models = [tf.keras.models.load_model(path) for path in MODEL_PATHS]
except Exception as e:
    print(f"Warning: Could not load ensemble models: {e}. Falling back to fold4 (from main0.py)")
    try:
        ensemble_models = [tf.keras.models.load_model("efficientnetv2l_multilabel_fold4.keras")]
    except:
        ensemble_models = []

try:
    thresholds = np.load("efficientnetv2l_multilabel_final_thresholds.npy").astype(np.float32)
except:
    thresholds = None

def make_gradcam_heatmap(img_array, model, nested_model_name, last_conv_layer_name, pred_index=None):
    try:
        inner_model = model.get_layer(nested_model_name)
    except:
        return None # Model structure might be different
        
    inner_model_index = 0
    for i, layer in enumerate(model.layers):
        if layer.name == nested_model_name:
            inner_model_index = i
            break
    classifier_layers = model.layers[inner_model_index + 1:]

    grad_model_inner = tf.keras.models.Model(
        [inner_model.inputs], 
        [inner_model.get_layer(last_conv_layer_name).output, inner_model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, inner_output = grad_model_inner(img_array)
        x = inner_output
        for layer in classifier_layers:
            x = layer(x)
        preds = x
        if pred_index is None:
            pred_index = tf.argmax(preds[0])
        class_channel = preds[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    if grads[0] is None:
        return None
    heatmap = conv_outputs[0] * grads[0]
    heatmap = tf.reduce_sum(heatmap, axis=-1)
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
    open_cv_image = np.array(img_pil.convert("RGB"))[:, :, ::-1].copy()
    hsv = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2HSV)
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([25, 180, 255], dtype=np.uint8)
    skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
    skin_percentage = (np.sum(skin_mask == 255) / skin_mask.size) * 100
    return skin_percentage >= 45.0

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
    if laplacian_var < 40.0: 
        return False, f"Image is too blurry (Sharpness Score: {round(laplacian_var, 2)}). Please stabilize your camera and retake."
        
    mean_brightness = gray.mean()
    if mean_brightness < 45.0:
        return False, f"Image is too dark (Brightness: {round(mean_brightness, 2)}). Please activate your camera flash or use external light."
    if mean_brightness > 230.0:
        return False, f"Image is overexposed (Brightness: {round(mean_brightness, 2)}). Avoid direct glare or harsh lighting on the skin lesion."
        
    return True, "Success"

def compute_abcde_structural_metrics(img_processed) -> dict:
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
    default_metrics = {
        "asymmetry": 0.0, "borderIrregularity": 0.0, 
        "colorDivergence": 0.0, "diameterProfile": 0.0, "evolvingTracking": 0.0
    }
    if lesion_area == 0: return default_metrics

    M = cv2.moments(mask)
    if M["m00"] == 0: return default_metrics
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
        
        _, _, bbox_w, bbox_h = cv2.boundingRect(largest_contour)
        max_pixel_extension = max(bbox_w, bbox_h)
        diameter_score = min(100.0, (max_pixel_extension / max(h, w)) * 130)

    lesion_pixels = rgb_padded[mask == 255]
    if len(lesion_pixels) > 0:
        std_r = np.std(lesion_pixels[:, 0])
        std_g = np.std(lesion_pixels[:, 1])
        std_b = np.std(lesion_pixels[:, 2])
        mean_std = (std_r + std_g + std_b) / 3.0
        color_score = min(100.0, mean_std * 2.2)
    else:
        color_score = 0.0

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
