import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    VITE_API_URL: str = os.getenv("VITE_API_URL", "http://localhost:5173") # Assuming 5173 is Vite default

    class Config:
        env_file = ".env"

settings = Settings()
