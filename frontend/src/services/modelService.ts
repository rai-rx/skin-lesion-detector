import { getApiUrl } from './apiUrl';

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

export async function analyzeSkinLesion(base64Image: string): Promise<ModelResult> {
  // 1. Convert Base64 to a Blob (File)
  const response = await fetch(base64Image);
  const blob = await response.blob();

  // 2. Create FormData (This matches FastAPI's UploadFile)
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  try {
    // This looks at the "VITE_API_URL" you set in the Vercel Dashboard
    const baseUrl = getApiUrl();

    const apiResponse = await fetch(`${baseUrl}/predict`, {
        method: 'POST',
        headers: {
            // These headers tell ngrok/localtunnel to let the data through
            'ngrok-skip-browser-warning': 'true',
            'Bypass-Tunnel-Reminder': 'true',
        },
        body: formData,
    });

    if (!apiResponse.ok) {
        throw new Error('Prediction failed');
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