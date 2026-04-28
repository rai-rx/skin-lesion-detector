# Backend Folder

This folder is reserved for backend model logic and API endpoints.

## What is included

- `model.ts`: a stubbed prediction module with typed model output.

## Next steps

1. Create an API route or server endpoint that accepts image payloads.
2. Use `predictSkinLesion(imageDataUrl)` from `model.ts` to perform inference.
3. Expose the endpoint at `/api/model/predict` so the frontend can call it.
4. Replace the stubbed return values with real model predictions.
