-- ============================================================
-- HobbyConnect — Migration 004: category tags for fuzzy search
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add tags column
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Pre-populate tags for default categories
UPDATE public.categories SET tags = ARRAY['deporte','sport','ejercicio','pelota','futbol','partido','campo']          WHERE name = 'Fútbol';
UPDATE public.categories SET tags = ARRAY['deporte','sport','raqueta','ejercicio','cancha','tenis']                  WHERE name = 'Tenis';
UPDATE public.categories SET tags = ARRAY['deporte','sport','ejercicio','pelota','basket','nba','cancha']            WHERE name = 'Baloncesto';
UPDATE public.categories SET tags = ARRAY['cultura','creatividad','pintura','dibujo','manualidades','visual']        WHERE name = 'Arte';
UPDATE public.categories SET tags = ARRAY['cultura','sonido','entretenimiento','concierto','banda','instrumento']    WHERE name = 'Música';
UPDATE public.categories SET tags = ARRAY['cultura','libros','conocimiento','aprendizaje','literatura','club']       WHERE name = 'Lectura';
