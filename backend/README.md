# Backend Folder

This folder is reserved for backend model logic and API endpoints.

## What is included

- `model.ts`: a stubbed prediction module with typed model output.
- `seed.py`: Database seeding script for creating admin users

## Setup & Database Seeding

### Creating an Admin User

To seed the database with an admin account, run the seed script:

```bash
# First, ensure your .env file is configured with Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ADMIN_PASSWORD=your_admin_password (optional, defaults to "TempPassword123!")

python seed.py
```

This will:
1. Create an admin user with email: `admin.skineleven@gmail.com`
2. Set the password from `ADMIN_PASSWORD` environment variable
3. Automatically assign the `admin` role via the database trigger

**Note:** The first user created in the system automatically gets the `admin` role.

## Next steps

1. Create an API route or server endpoint that accepts image payloads.
2. Use `predictSkinLesion(imageDataUrl)` from `model.ts` to perform inference.
3. Expose the endpoint at `/api/model/predict` so the frontend can call it.
4. Replace the stubbed return values with real model predictions.
