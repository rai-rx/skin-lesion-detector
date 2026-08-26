-- New registrations must never gain admin access implicitly.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user'::user_role
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;