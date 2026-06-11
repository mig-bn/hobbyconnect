'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Activity, Category, Profile, SocialLink } from '@/types'
import RatingModal from './RatingModal'
import EditProfileModal from './EditProfileModal'
import SocialLinksDisplay from './SocialLinksDisplay'

type RatingRow = {
  id: string
  score: number
  comment: string | null
  created_at: string
  rater: Pick<Profile, 'username' | 'full_name' | 'avatar_url'> | null
  activity: { title: string } | null
}

type Props = {
  profile: Profile
  createdActivities: Activity[]
  joinedActivities: Activity[]
  ratings: RatingRow[]
  isOwner: boolean
  rateableActivityId: string | null
  currentUserId: string | null
  categories: Category[]
  socialLinks: SocialLink[]
  isFriend: boolean
}

type Tab = 'created' | 'joined' | 'reviews'

const SCORE_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!']

// ─── Minimal activity list item (navigates on click) ─────────────────────────

function ActivityItem({ activity }: { activity: Activity }) {
  const date = new Date(activity.scheduled_at)
  const dateStr = date.toLocaleDateString('es-CO', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const spotsLeft = activity.max_participants - (activity.participants_count ?? 0)
  const color = activity.category?.color ?? '#6b7280'

  return (
    <Link
      href={`/activity/${activity.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        {activity.category?.emoji ?? '📌'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{activity.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          🗓 {dateStr} · {timeStr}
        </p>
        <p className="text-xs text-gray-400 truncate">📍 {activity.location_name}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            spotsLeft > 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {spotsLeft > 0 ? `${spotsLeft} cupos` : 'Lleno'}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            activity.is_free ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {activity.is_free ? 'Gratis' : `$${activity.cost}`}
        </span>
      </div>
    </Link>
  )
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: RatingRow }) {
  const raterName = review.rater?.full_name || `@${review.rater?.username}` || 'Usuario'
  const initials = raterName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const date = new Date(review.created_at).toLocaleDateString('es-CO', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.rater?.avatar_url ? (
          <img
            src={review.rater.avatar_url}
            alt={raterName}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-900">{raterName}</p>
              {review.activity && (
                <p className="text-xs text-gray-400 truncate">
                  en &ldquo;{review.activity.title}&rdquo;
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-sm">{'⭐'.repeat(review.score)}</span>
              <span className="text-xs text-gray-500 font-medium">
                {SCORE_LABELS[review.score]}
              </span>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}

          <p className="text-xs text-gray-400 mt-1.5">{date}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ProfileClient({
  profile,
  createdActivities,
  joinedActivities,
  ratings,
  isOwner,
  rateableActivityId,
  currentUserId,
  categories,
  socialLinks,
  isFriend,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('created')
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [localRatings, setLocalRatings] = useState(ratings)

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'created', label: 'Creadas', count: createdActivities.length },
    { id: 'joined', label: 'Participadas', count: joinedActivities.length },
    { id: 'reviews', label: 'Reseñas', count: localRatings.length },
  ]

  const handleRatingSuccess = (score: number, comment: string) => {
    // Optimistically prepend a new review
    setLocalRatings(prev => [
      {
        id: `opt-${Date.now()}`,
        score,
        comment: comment || null,
        created_at: new Date().toISOString(),
        rater: null,
        activity: null,
      },
      ...prev,
    ])
  }

  return (
    <>
      {/* Edit profile button — shown only to owner */}
      {isOwner && (
        <div className="mb-4">
          <button
            onClick={() => setEditModalOpen(true)}
            className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            ✏️ Editar perfil
          </button>
        </div>
      )}

      {/* Rate button — shown only to other users who can rate */}
      {!isOwner && rateableActivityId && currentUserId !== null && (
        <div className="mb-4">
          <button
            onClick={() => setRatingModalOpen(true)}
            className="w-full py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-100 active:bg-amber-200 transition-colors"
          >
            ⭐ Calificar a {profile.full_name || `@${profile.username}`}
          </button>
        </div>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isOwner ? 'Mis redes sociales' : 'Contactar'}
          </p>
          <SocialLinksDisplay
            links={socialLinks}
            isFriend={isFriend}
            isOwner={isOwner}
          />
          {!isOwner && !isFriend && socialLinks.some(l => l.visibility === 'friends') && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              🤝 Hazte amigo para ver más formas de contacto
            </p>
          )}
        </div>
      )}

      {/* Tab panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'created' && (
            <ActivitySection
              activities={createdActivities}
              empty="No ha creado actividades aún"
            />
          )}
          {activeTab === 'joined' && (
            <ActivitySection
              activities={joinedActivities}
              empty="No ha participado en actividades aún"
            />
          )}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {localRatings.length === 0 ? (
                <EmptyState icon="⭐" message="Sin calificaciones todavía" />
              ) : (
                localRatings.map(r => <ReviewCard key={r.id} review={r} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating modal */}
      {rateableActivityId && (
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          ratedProfile={profile}
          activityId={rateableActivityId}
          onSuccess={handleRatingSuccess}
        />
      )}

      {/* Edit profile modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={profile}
        categories={categories}
        socialLinks={socialLinks}
      />
    </>
  )
}

function ActivitySection({
  activities,
  empty,
}: {
  activities: Activity[]
  empty: string
}) {
  if (activities.length === 0) return <EmptyState icon="📭" message={empty} />
  return (
    <div className="space-y-2">
      {activities.map(a => (
        <ActivityItem key={a.id} activity={a} />
      ))}
    </div>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="py-12 text-center text-gray-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
