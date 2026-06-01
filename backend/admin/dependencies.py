from fastapi import Depends, HTTPException, status
from auth.dependencies import get_current_user
from typing import Dict, Any
from database import supabase

def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    # Check the user's role in the database
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    try:
        response = supabase.table("users").select("role").eq("id", user_id).single().execute()
        if not response.data or response.data.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough privileges"
            )
        return user
    except Exception as e:
         raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not verify privileges"
            )
