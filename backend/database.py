from supabase import create_client, Client
from config import settings

# Use the service role key for backend operations so we can bypass RLS 
# or act on behalf of the user when necessary. 
# We'll use this client primarily for DB operations that the frontend can't do,
# or when processing predictions.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
