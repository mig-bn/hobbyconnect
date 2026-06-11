-- ============================================================
-- HobbyConnect — Migration 002: interests + categories insert
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add interests column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests uuid[] DEFAULT '{}';

-- 2. Allow authenticated users to insert new categories
CREATE POLICY "Authenticated users can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
