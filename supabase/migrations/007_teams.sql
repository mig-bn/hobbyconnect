-- ─── Teams ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  emoji       TEXT        NOT NULL DEFAULT '⚽',
  color       TEXT        NOT NULL DEFAULT '#3b82f6',
  creator_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Team members ─────────────────────────────────────────────────────────────
-- role: 'captain' | 'member'
-- status: 'pending' (invited, not yet accepted) | 'accepted' | 'declined'
CREATE TABLE IF NOT EXISTS public.team_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams: any authenticated user can see all teams (needed for search / tournaments)
CREATE POLICY "teams_select"
  ON public.teams FOR SELECT TO authenticated USING (true);

-- Only creator can create
CREATE POLICY "teams_insert"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Creator or accepted captain can update
CREATE POLICY "teams_update"
  ON public.teams FOR UPDATE TO authenticated
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
        AND role = 'captain' AND status = 'accepted'
    )
  );

-- Only creator can delete
CREATE POLICY "teams_delete"
  ON public.teams FOR DELETE TO authenticated
  USING (creator_id = auth.uid());

-- ── team_members ──────────────────────────────────────────────────────────────

-- Visible to: the member themselves OR any accepted member of the same team
CREATE POLICY "team_members_select"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.status = 'accepted'
    )
  );

-- Insert allowed when:
--   a) creator is adding themselves (captain row during team creation), OR
--   b) an accepted member is inviting someone else
CREATE POLICY "team_members_insert"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    (
      user_id = auth.uid()
      AND role = 'captain'
      AND EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND creator_id = auth.uid())
    )
    OR (
      invited_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.team_members tm2
        WHERE tm2.team_id = team_members.team_id
          AND tm2.user_id = auth.uid()
          AND tm2.status = 'accepted'
      )
    )
  );

-- Update allowed for:
--   a) the member themselves (accept/decline),
--   b) captain of the team,
--   c) team creator
CREATE POLICY "team_members_update"
  ON public.team_members FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'captain'
        AND tm2.status = 'accepted'
    )
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND creator_id = auth.uid())
  );

-- Delete allowed for member themselves (leave) OR captain OR creator
CREATE POLICY "team_members_delete"
  ON public.team_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm2
      WHERE tm2.team_id = team_members.team_id
        AND tm2.user_id = auth.uid()
        AND tm2.role = 'captain'
        AND tm2.status = 'accepted'
    )
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND creator_id = auth.uid())
  );
