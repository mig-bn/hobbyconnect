-- ============================================================
-- HobbyConnect — Migration 006: Social Links
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.social_links (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform   text    NOT NULL CHECK (platform IN (
               'whatsapp','telegram','instagram','twitter',
               'facebook','tiktok','discord','email','youtube','linkedin'
             )),
  handle     text    NOT NULL,
  -- public = todos | friends = solo amigos | private = nadie (oculto)
  visibility text    NOT NULL DEFAULT 'public'
             CHECK (visibility IN ('public','friends','private')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_links_user ON public.social_links (user_id);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- El dueño ve todos sus propios links
CREATE POLICY "Owner sees all own links"
  ON public.social_links FOR SELECT
  USING (auth.uid() = user_id);

-- Los demás ven links según visibilidad (lógica de amigos se maneja en el servidor)
CREATE POLICY "Others see public links"
  ON public.social_links FOR SELECT
  USING (
    auth.uid() <> user_id AND visibility = 'public'
  );

CREATE POLICY "Owner can insert"
  ON public.social_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update"
  ON public.social_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can delete"
  ON public.social_links FOR DELETE
  USING (auth.uid() = user_id);
