import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Activity } from '@/types'

export const metadata = { title: 'Feed — HobbyConnect' }

function ActivityFeedCard({ activity }: { activity: Activity }) {
  const date = new Date(activity.scheduled_at)
  const dateStr = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const spotsLeft = activity.max_participants - (activity.participants_count ?? 0)
  const allCats = activity.categories ?? []
  const primaryColor = allCats[0]?.color ?? '#6b7280'
  const creatorName = activity.creator?.full_name || `@${activity.creator?.username}` || 'Alguien'

  return (
    <Link
      href={`/activity/${activity.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-4"
    >
      {/* Top row: categories + cost */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1">
          {allCats.map(cat => (
            <span
              key={cat.id}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.emoji} {cat.name}
            </span>
          ))}
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            activity.is_free
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {activity.is_free ? '🆓 Gratis' : `💰 $${activity.cost}`}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
        {activity.title}
      </h3>

      {/* Creator */}
      <p className="text-xs text-gray-400 mb-3">
        Organizado por <span className="font-medium text-gray-600">{creatorName}</span>
      </p>

      {/* Description */}
      {activity.description && (
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-600 font-medium">
            🗓 {dateStr} · {timeStr}
          </p>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">
            📍 {activity.location_name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              spotsLeft > 0
                ? 'bg-blue-50 text-blue-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {spotsLeft > 0 ? `${spotsLeft} cupos` : 'Lleno'}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              activity.is_free ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {activity.is_free ? '🆓 Gratis' : `💰 $${activity.cost}`}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: activitiesRaw } = await supabase
    .from('activities')
    .select(
      '*, creator:profiles(*), participants:activity_participants(user_id), activity_categories(categories(*))'
    )
    .eq('status', 'open')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(50)

  const activities: Activity[] = (activitiesRaw ?? []).map((a: any) => ({
    ...a,
    categories: (a.activity_categories ?? []).map((ac: any) => ac.categories).filter(Boolean),
    participants_count: Array.isArray(a.participants) ? a.participants.length : 0,
  }))

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
          <p className="text-sm text-gray-500 mt-1">
            Próximas actividades abiertas en Barranquilla
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="text-5xl mb-4">🗺️</span>
            <p className="text-base font-semibold text-gray-600">No hay actividades próximas</p>
            <p className="text-sm text-gray-400 mt-1">
              Sé el primero en crear una en el mapa
            </p>
                  <Link
              href="/map"
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Ir al mapa
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <ActivityFeedCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
