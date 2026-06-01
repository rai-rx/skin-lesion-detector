from fastapi import APIRouter, Depends
from typing import Dict, Any
from admin.dependencies import require_admin
from database import supabase

router = APIRouter()

@router.get("/users")
async def get_users(user: Dict[str, Any] = Depends(require_admin)):
    # Simple fetch all for now, in a real app would use pagination
    res = supabase.table("users").select("id, email, full_name, role, created_at").execute()
    return res.data

@router.get("/analytics")
async def get_analytics(user: Dict[str, Any] = Depends(require_admin)):
    # This would typically be done with more complex SQL via RPC or Edge Functions,
    # but for simplicity we can fetch the data and aggregate here, or just return counts.
    
    users_res = supabase.table("users").select("id", count="exact").execute()
    scans_res = supabase.table("scans").select("id", count="exact").execute()
    
    return {
        "totalUsers": users_res.count if hasattr(users_res, 'count') else 0,
        "totalScans": scans_res.count if hasattr(scans_res, 'count') else 0,
    }
