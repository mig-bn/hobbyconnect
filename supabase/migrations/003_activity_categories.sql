-- ============================================================
-- HobbyConnect — Migration 003: many-to-many activity categories
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Make category_id nullable (activities can have multiple categories now)
ALTER TABLE public.activities
  ALTER COLUMN category_id DROP NOT NULL;

-- 2. Create junction table
CREATE TABLE IF NOT EXISTS public.activity_categories (
  activity_id uuid REFERENCES public.activities(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, category_id)
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_activity_categories_activity ON public.activity_categories (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_categories_category ON public.activity_categories (category_id);

-- 4. RLS
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity categories viewable by everyone"
  ON public.activity_categories FOR SELECT
  USING (true);

CREATE POLICY "Creators can insert activity categories"
  ON public.activity_categories FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT creator_id FROM public.activities WHERE id = activity_id
    )
  );

CREATE POLICY "Creators can delete activity categories"
  ON public.activity_categories FOR DELETE
  USING (
    auth.uid() = (
      SELECT creator_id FROM public.activities WHERE id = activity_id
    )
  );

-- 5. Migrate existing single categories to junction table
INSERT INTO public.activity_categories (activity_id, category_id)
SELECT id, category_id
FROM public.activities
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
