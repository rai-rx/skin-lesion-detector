export async function predictSkinLesion(imageDataUrl: string): Promise<ModelResult> {
  // 1. Convert DataURL to Blob
  const byteString = atob(imageDataUrl.split(',')[1]);
  const mimeString = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });

  // 2. Prepare Multipart Form Data
  const formData = new FormData();
  formData.append('file', blob, 'image.jpg');

  // 3. Call your FastAPI backend
  const response = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Inference failed');
  }

  return await response.json();
}