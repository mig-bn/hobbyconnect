-- ============================================================
-- HobbyConnect — Seed: Admin user
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Crear usuario en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@hobbyconnect.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"full_name": "Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@hobbyconnect.com'
);

-- 2. Actualizar username en profiles (el trigger lo crea con "admin" por defecto desde el email)
UPDATE public.profiles
SET username = 'admin', full_name = 'Admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@hobbyconnect.com'
);
