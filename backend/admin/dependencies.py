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
        response = supabase.table("users").select("role").eq("id", user_id).execute()
        if not response.data or len(response.data) == 0 or response.data[0].get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough privileges"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
         print(f"Admin check error: {e}")
         raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not verify privileges"
            )
