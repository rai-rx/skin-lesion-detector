from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from predictions.router import router as predictions_router
from admin.router import router as admin_router

app = FastAPI(title="SkinEleven Backend API")

# Allow requests from any origin (for development)
# In production, specify exact domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions_router, tags=["predictions"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "SkinEleven Backend API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)