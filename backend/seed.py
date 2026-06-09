"""
Seed script to create an admin user in Supabase.
This script should be run once to set up the admin account.

Usage:
    python seed.py
"""

from supabase import create_client, Client
from config import settings

ADMIN_EMAIL = "admin.skineleven@gmail.com"
ADMIN_FULL_NAME = "Admin"


def find_user_by_email(supabase: Client, email: str):
    """Find an existing Supabase auth user by email."""
    users = supabase.auth.admin.list_users()
    if users is None:
        return None
    for user in users:
        if getattr(user, "email", "").lower() == email.lower():
            return user
    return None


def seed_admin_user():
    """Create or update an admin user account in Supabase."""
    
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    admin_password = settings.ADMIN_PASSWORD
    
    existing_user = find_user_by_email(supabase, ADMIN_EMAIL)
    if existing_user:
        print(f"⚠ Admin user already exists with email: {ADMIN_EMAIL}")
        print(f"  User ID: {existing_user.id}")
        print("  Resetting password to current ADMIN_PASSWORD...")
        supabase.auth.admin.update_user_by_id(
            existing_user.id,
            {
                "password": admin_password,
                "email_confirm": True,
                "user_metadata": {"full_name": ADMIN_FULL_NAME},
            },
        )
        print("✓ Admin password has been reset.")
        print("\nNote: The trigger on auth.users will keep the public.users admin role in sync.")
        return
    
    try:
        user_response = supabase.auth.admin.create_user(
            {"email": ADMIN_EMAIL, "password": admin_password, "email_confirm": True}
        )
        
        supabase.auth.admin.update_user_by_id(
            user_response.user.id,
            {"user_metadata": {"full_name": ADMIN_FULL_NAME}}
        )
        
        print(f"✓ Admin user created successfully!")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  User ID: {user_response.user.id}")
        print(f"\nNote: The trigger on auth.users will automatically create a public.users record with admin role.")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        raise

if __name__ == "__main__":
    print("Starting admin user seed...")
    print("-" * 50)
    seed_admin_user()
    print("-" * 50)
    print("Seeding complete!")
