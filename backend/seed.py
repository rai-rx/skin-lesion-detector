"""
Seed script to create an admin user in Supabase.
This script should be run once to set up the admin account.

Usage:
    python seed.py
"""

from supabase import create_client, Client
from config import settings
import os

def seed_admin_user():
    """Create an admin user account in Supabase."""
    
    # Use the service role key for backend operations
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    admin_email = "admin.skineleven@gmail.com"
    admin_password = os.getenv("ADMIN_PASSWORD", "TempPassword123!")  # Should be set in .env
    admin_full_name = "Admin"
    
    try:
        # Create user in auth.users
        user_response = supabase.auth.admin.create_user(
            email=admin_email,
            password=admin_password,
            email_confirm=True,
            user_metadata={"full_name": admin_full_name}
        )
        
        print(f"✓ Admin user created successfully!")
        print(f"  Email: {admin_email}")
        print(f"  User ID: {user_response.user.id}")
        print(f"\nNote: The trigger on auth.users will automatically create a public.users record with admin role.")
        
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg or "duplicate" in error_msg:
            print(f"⚠ Admin user already exists with email: {admin_email}")
            print("No action taken.")
        else:
            print(f"✗ Error creating admin user: {e}")
            raise

if __name__ == "__main__":
    print("Starting admin user seed...")
    print("-" * 50)
    seed_admin_user()
    print("-" * 50)
    print("Seeding complete!")
