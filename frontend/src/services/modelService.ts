export type ModelPrediction = {
  name: string;
  confidence: number;
};

export type ModelResult = {
  classification: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  secondaryPredictions: ModelPrediction[];
  notes?: string;
  heatmap?: string; // <--- ADD THIS: This will hold the Base64 string from FastAPI
};

const fallbackAnalysis: ModelResult = {
  classification: 'Benign Nevus (Mole)',
  confidence: 87.3,
  riskLevel: 'low',
  secondaryPredictions: [
    { name: 'Seborrheic Keratosis', confidence: 8.2 },
    { name: 'Melanoma', confidence: 3.1 },
    { name: 'Basal Cell Carcinoma', confidence: 1.4 },
  ],
  notes: 'Fallback model output used because the backend service was unavailable.',
  heatmap: '', // Optional: Add a placeholder or leave empty
};

export async function analyzeSkinLesion(base64Image: string): Promise<ModelResult> {
  // 1. Convert Base64 to a Blob (File)
  const response = await fetch(base64Image);
  const blob = await response.blob();

  // 2. Create FormData (This matches FastAPI's UploadFile)
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  try {
    // 3. Point to your local FastAPI server
    const apiResponse = await fetch('https://fuzzy-wombats-joke.loca.lt/predict', {
    method: 'POST',
    headers: {
        // Use Capitalized keys to be safe with Localtunnel
        'Bypass-Tunnel-Reminder': 'true', 
    },
    body: formData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.detail || 'Prediction failed');
    }

    // The backend now returns { prediction: ModelResult, heatmap: string }
    // Or just the ModelResult object containing the heatmap field.
    return await apiResponse.json();
  } catch (error) {
    console.error("API Error:", error);
    // For your thesis, you might want to return the fallback 
    // during development so the UI doesn't break if the backend is off.
    // return fallbackAnalysis; 
    throw error;
  }
}