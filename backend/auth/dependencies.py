from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
from config import settings
from typing import Optional, Dict, Any
import requests

security = HTTPBearer(auto_error=False)
_jwks_cache: Optional[Dict[str, Any]] = None


def _get_jwks() -> Dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None:
        response = requests.get(
            f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json",
            timeout=5,
        )
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache

def verify_supabase_token(token: str) -> Dict[str, Any]:
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")

        if algorithm == "HS256":
            key = settings.SUPABASE_JWT_SECRET
        elif algorithm in {"ES256", "RS256"}:
            key_data = next(
                (key for key in _get_jwks().get("keys", []) if key.get("kid") == header.get("kid")),
                None,
            )
            if key_data is None:
                raise JWTError("No matching Supabase signing key found")
            key = jwk.construct(key_data, algorithm=algorithm).key
        else:
            raise JWTError(f"Unsupported token algorithm: {algorithm}")

        payload = jwt.decode(
            token,
            key,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_supabase_token(credentials.credentials)

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    return verify_supabase_token(credentials.credentials)
