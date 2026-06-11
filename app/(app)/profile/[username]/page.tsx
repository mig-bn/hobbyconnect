import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Activity, Profile } from '@/types'
import ReputationStars from '@/components/Profile/ReputationStars'
import ProfileClient from '@/components/Profile/ProfileClient'
import AddFriendButton from '@/components/Friends/AddFriendButton'

type Props = { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} — HobbyConnect` }
}

// ─── Find the first past activity where both users participated and hasn't been rated yet

async function findRateableActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentUserId: string,
  profileId: string
): Promise<string | null> {
  // Get past activities where current user participated
  const { data: myParticipations } = await supabase
    .from('activity_participants')
    .select('activity_id')
    .eq('user_id', currentUserId)

  const myActivityIds = myParticipations?.map(p => p.activity_id) ?? []
  if (myActivityIds.length === 0) return null

  // Among those, find which ones profile user also participated in + already passed
  const { data: shared } = await supabase
    .from('activity_participants')
    .select('activity_id, activity:activities!inner(scheduled_at)')
    .eq('user_id', profileId)
    .in('activity_id', myActivityIds)
    .lt('activity.scheduled_at', new Date().toISOString())

  const sharedIds = shared?.map(s => s.activity_id) ?? []
  if (sharedIds.length === 0) return null

  // Exclude already-rated activities
  const { data: existing } = await supabase
    .from('ratings')
    .select('activity_id')
    .eq('rater_id', currentUserId)
    .eq('rated_id', profileId)
    .in('activity_id', sharedIds)

  const ratedIds = existing?.map(r => r.activity_id) ?? []
  return sharedIds.find(id => !ratedIds.includes(id)) ?? null
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  const isOwner = user?.id === profile.id

  // Check friendship status
  let friendshipId: string | null = null
  let friendshipStatus: string | null = null
  if (user && !isOwner) {
    const { data: fs } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
      .single()
    if (fs) { friendshipId = fs.id; friendshipStatus = fs.status }
  }

  const isFriend = friendshipStatus === 'accepted'

  // Parallel data fetch
  const [
    { data: createdRaw },
    { data: participations },
    { data: ratings },
    { data: categories },
    { data: allSocialLinks },
  ] = await Promise.all([
    // Activities created by this user
    supabase
      .from('activities')
      .select(
        '*, category:categories(*), creator:profiles(*), participants:activity_participants(user_id)'
      )
      .eq('creator_id', profile.id)
      .order('scheduled_at', { ascending: false })
      .limit(30),

    // Activity IDs this user joined (then fetch those activities)
    supabase
      .from('activity_participants')
      .select('activity_id')
      .eq('user_id', profile.id),

    // Ratings received, with rater info
    supabase
      .from('ratings')
      .select(
        '*, rater:profiles!ratings_rater_id_fkey(username, full_name, avatar_url), activity:activities(title)'
      )
      .eq('rated_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30),

    // Categories for interests editing
    supabase.from('categories').select('*').order('name'),

    // Social links — fetch all of this profile's public links + friends-only if viewer is a friend/owner
    supabase
      .from('social_links')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true }),
  ])

  // Fetch joined activities separately (avoid deep nesting issues)
  const joinedIds = (participations ?? []).map(p => p.activity_id)
  const { data: joinedRaw } =
    joinedIds.length > 0
      ? await supabase
          .from('activities')
          .select(
            '*, category:categories(*), creator:profiles(*), participants:activity_participants(user_id)'
          )
          .in('id', joinedIds)
          .order('scheduled_at', { ascending: false })
          .limit(30)
      : { data: [] }

  // Filter social links by visibility rules
  const socialLinks = (allSocialLinks ?? []).filter(link => {
    if (isOwner) return true
    if (link.visibility === 'public') return true
    if (link.visibility === 'friends' && isFriend) return true
    return false
  })

  const toActivity = (a: any): Activity => ({
    ...a,
    participants_count: Array.isArray(a.participants) ? a.participants.length : 0,
  })

  const createdActivities = (createdRaw ?? []).map(toActivity)
  const joinedActivities = (joinedRaw ?? []).map(toActivity)

  // Check if current user can rate this profile
  let rateableActivityId: string | null = null
  if (user && !isOwner) {
    rateableActivityId = await findRateableActivity(supabase, user.id, profile.id)
  }

  const p = profile as Profile

  const initials = (p.full_name || p.username)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
        {/* ── Profile header card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.username}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-md">
                {initials}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight truncate">
                {p.full_name || p.username}
              </h1>
              <p className="text-sm text-gray-500">@{p.username}</p>
              {p.city && (
                <p className="text-sm text-gray-500 mt-0.5">🌆 {p.city}</p>
              )}
              <div className="mt-2.5">
                <ReputationStars
                  score={p.reputation_score ?? 5}
                  total={p.total_ratings ?? 0}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Friend button */}
          {!isOwner && user && (
            <div className="mt-3">
              <AddFriendButton
                profileId={profile.id}
                friendshipId={friendshipId}
                friendshipStatus={friendshipStatus}
                isRequester={friendshipId ? true : false}
              />
            </div>
          )}

          {/* Bio */}
          {p.bio && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {p.bio}
            </p>
          )}

          {/* Interests */}
          {p.interests && p.interests.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Intereses</p>
              <div className="flex flex-wrap gap-1.5">
                {(categories ?? [])
                  .filter(cat => p.interests.includes(cat.id))
                  .map(cat => (
                    <span
                      key={cat.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.emoji} {cat.name}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {createdActivities.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Creadas</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {joinedActivities.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Participadas</p>
            </div>
            <div className="w-px bg-gray-100" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">
                {ratings?.length ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Reseñas</p>
            </div>
          </div>
        </div>

        {/* ── Interactive section (tabs, rating button) ───────────────── */}
        <ProfileClient
          profile={p}
          createdActivities={createdActivities}
          joinedActivities={joinedActivities}
          ratings={(ratings ?? []) as any}
          isOwner={isOwner}
          rateableActivityId={rateableActivityId}
          currentUserId={user?.id ?? null}
          categories={categories ?? []}
          socialLinks={socialLinks as any}
          isFriend={isFriend}
        />
      </div>
    </div>
  )
}
