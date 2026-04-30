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
model = tf.keras.models.load_model("efficientnetv2l_multilabel_final.keras")
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



@app.post("/predict")
async def predict_lesion(file: UploadFile = File(...)):
    # 1. Preprocess
    contents = await file.read()
    original_img = Image.open(io.BytesIO(contents)).convert("RGB")
    orig_w, orig_h = original_img.size
    
    # NEW: Center crop first, then resize to 480
    img_processed = center_crop_and_resize(original_img, IMG_SIZE)
    
    # Convert to NumPy array
    arr = np.asarray(img_processed).astype(np.float32)
    
    # IMPORTANT: EfficientNetV2 usually handles scaling internally, 
    # but let's use the official preprocess_input to be safe.
    arr_preprocessed = tf.keras.applications.efficientnet_v2.preprocess_input(arr)
    
    # Add batch dimension (None, 480, 480, 3)
    x = tf.convert_to_tensor(arr_preprocessed[None, ...], dtype=tf.float32)

    # 2. Inference
    probs = model.predict(x, verbose=0)[0]
    
    # 3. Generate Heatmap
    # 3. Generate Heatmap (HiResCAM)
    try:
        heatmap_raw = make_gradcam_heatmap(
            x, 
            model, 
            "efficientnetv2-l", 
            "top_activation"
        )
        
        if heatmap_raw is not None:
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
        import traceback
        traceback.print_exc() 
        heatmap_data_uri = None


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
        "notes": f"Analyzed at {IMG_SIZE}px using Grad-CAM XAI visualization.",
        "heatmap": heatmap_data_uri 
    }


if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to make sure it's accessible locally
    uvicorn.run(app, host="0.0.0.0", port=8000)