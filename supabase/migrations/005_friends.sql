-- ============================================================
-- HobbyConnect — Migration 005: Friends + Activity Invitations
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships (requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships (addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON public.friendships (status);

-- 2. Activity invitations table
CREATE TABLE IF NOT EXISTS public.activity_invitations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid        NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  inviter_id  uuid        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  invitee_id  uuid        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (activity_id, invitee_id),
  CHECK (inviter_id <> invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_invitee  ON public.activity_invitations (invitee_id);
CREATE INDEX IF NOT EXISTS idx_invitations_activity ON public.activity_invitations (activity_id);

-- 3. Add visibility to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'friends_only'));

-- 4. RLS — Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Addressee can accept/reject; requester can cancel"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "Either party can remove friendship"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 5. RLS — Activity invitations
ALTER TABLE public.activity_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter or invitee can see invitation"
  ON public.activity_invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Activity creator can send invitations"
  ON public.activity_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    auth.uid() = (SELECT creator_id FROM public.activities WHERE id = activity_id)
  );

CREATE POLICY "Invitee can respond to invitation"
  ON public.activity_invitations FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Inviter can cancel invitation"
  ON public.activity_invitations FOR DELETE
  USING (auth.uid() = inviter_id);
