import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { Activity, Category, Profile, SocialLink } from '@/types'
import ReputationStars from '@/components/Profile/ReputationStars'
import SocialLinksDisplay from '@/components/Profile/SocialLinksDisplay'
import ActivityDetailClient from './ActivityDetailClient'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('activities').select('title').eq('id', params.id).single()
  return { title: data ? `${data.title} — HobbyConnect` : 'Actividad — HobbyConnect' }
}

export default async function ActivityPage({ params }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch activity with categories and creator
  const { data: activityRaw } = await supabase
    .from('activities')
    .select(`
      *,
      category:categories(*),
      categories:activity_categories(category:categories(*)),
      creator:profiles(*),
      participants:activity_participants(user_id, joined_at, profile:profiles(id, username, full_name, avatar_url))
    `)
    .eq('id', params.id)
    .single()

  if (!activityRaw) notFound()

  const activity = {
    ...activityRaw,
    categories: activityRaw.categories?.map((c: any) => c.category).filter(Boolean) ?? [],
    participants_count: activityRaw.participants?.length ?? 0,
  } as Activity & { participants: { user_id: string; joined_at: string; profile: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> }[] }

  const creator = activityRaw.creator as Profile | null
  const isOwner = user?.id === activityRaw.creator_id
  const isParticipant = activity.participants.some(p => p.user_id === user?.id)

  // Check if viewer is friend of creator (for social link visibility)
  let isFriendOfCreator = false
  if (user && !isOwner && creator) {
    const { data: fs } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${creator.id}),and(requester_id.eq.${creator.id},addressee_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle()
    isFriendOfCreator = !!fs
  }

  // Fetch creator's social links (filter by visibility)
  let socialLinks: SocialLink[] = []
  if (creator) {
    const { data: links } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', creator.id)
      .order('created_at', { ascending: true })

    socialLinks = (links ?? []).filter(link => {
      if (isOwner) return true
      if (link.visibility === 'public') return true
      if (link.visibility === 'friends' && isFriendOfCreator) return true
      return false
    })
  }

  const date = new Date(activity.scheduled_at)
  const dateStr = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const spotsLeft = activity.max_participants - (activity.participants_count ?? 0)
  const isPast = date < new Date()
  const isCancelled = activity.status === 'cancelled'
  const isFull = spotsLeft <= 0 && !isParticipant

  const creatorInitials = creator
    ? (creator.full_name || creator.username)
        .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  // All categories for display
  const allCategories = (activity as any).categories as Category[]

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

        {/* Back button */}
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          ← Volver al mapa
        </Link>

        {/* ── Activity header card ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          {/* Categories */}
          {allCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allCategories.map(cat => (
                <span
                  key={cat.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.emoji} {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Title + status */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{activity.title}</h1>
              {(isCancelled || isPast) && (
                <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  isCancelled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isCancelled ? '✕ Cancelada' : '🏁 Finalizada'}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{activity.description}</p>
          )}

          {/* Info grid */}
          <div className="mt-4 space-y-2.5">
            <InfoRow icon="🗓" label="Fecha">
              <span className="capitalize">{dateStr}</span>
            </InfoRow>
            <InfoRow icon="⏰" label="Hora">
              {timeStr}
            </InfoRow>
            <InfoRow icon="📍" label="Lugar">
              <span>
                {activity.location_name}
                {activity.location_address && (
                  <span className="text-gray-400"> · {activity.location_address}</span>
                )}
              </span>
            </InfoRow>
            <InfoRow icon="👥" label="Cupos">
              <span className={spotsLeft > 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                {isParticipant
                  ? `Participando · ${spotsLeft} cupo${spotsLeft !== 1 ? 's' : ''} libre${spotsLeft !== 1 ? 's' : ''}`
                  : spotsLeft > 0
                  ? `${spotsLeft} de ${activity.max_participants} disponibles`
                  : 'Lleno'}
              </span>
            </InfoRow>
            <InfoRow icon="💰" label="Costo">
              {activity.is_free ? (
                <span className="text-emerald-600 font-medium">Gratis</span>
              ) : (
                <span className="text-amber-600 font-medium">${activity.cost?.toLocaleString('es-CO')}</span>
              )}
            </InfoRow>
          </div>
        </div>

        {/* ── Join / Leave button ──────────────────────────────────── */}
        {user && !isOwner && !isCancelled && !isPast && (
          <ActivityDetailClient
            activityId={activity.id}
            userId={user.id}
            isParticipant={isParticipant}
            isFull={isFull}
          />
        )}

        {/* ── Organizer card ───────────────────────────────────────── */}
        {creator && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Organizado por</p>

            <Link
              href={`/profile/${creator.username}`}
              className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity"
            >
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.username}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {creatorInitials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{creator.full_name || creator.username}</p>
                <p className="text-xs text-gray-500">@{creator.username}</p>
                <div className="mt-1">
                  <ReputationStars
                    score={creator.reputation_score ?? 5}
                    total={creator.total_ratings ?? 0}
                    size="sm"
                  />
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Social links */}
            {socialLinks.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Contactar al organizador
                </p>
                <SocialLinksDisplay
                  links={socialLinks}
                  isFriend={isFriendOfCreator}
                  isOwner={isOwner}
                />
              </div>
            ) : (
              !isOwner && (
                <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 rounded-xl">
                  El organizador no ha compartido sus datos de contacto
                </p>
              )
            )}

            {/* Hint for non-friends */}
            {!isOwner && !isFriendOfCreator && (creator as any).social_links_has_friends && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                🤝 Agrega al organizador como amigo para ver más formas de contacto
              </p>
            )}
          </div>
        )}

        {/* ── Participants ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Participantes ({activity.participants_count ?? 0}/{activity.max_participants})
          </p>

          {/* Capacity bar */}
          <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((activity.participants_count ?? 0) / activity.max_participants) * 100)}%`,
                backgroundColor: spotsLeft > 0 ? '#10b981' : '#ef4444',
              }}
            />
          </div>

          {activity.participants.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Sé el primero en unirte 🚀
            </p>
          ) : (
            <div className="space-y-2">
              {activity.participants.map((p: any) => {
                const pName = p.profile?.full_name || `@${p.profile?.username}` || 'Usuario'
                const pInitials = pName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                const joinDate = new Date(p.joined_at).toLocaleDateString('es-CO', {
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <Link
                    key={p.user_id}
                    href={`/profile/${p.profile?.username}`}
                    className="flex items-center gap-3 py-1.5 hover:opacity-70 transition-opacity"
                  >
                    {p.profile?.avatar_url ? (
                      <img
                        src={p.profile.avatar_url}
                        alt={pName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {pInitials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pName}</p>
                      {p.profile?.username && (
                        <p className="text-xs text-gray-400">@{p.profile.username}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">Se unió {joinDate}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Small helper for info rows ───────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base w-5 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
        <span className="text-sm text-gray-800">{children}</span>
      </div>
    </div>
  )
}
