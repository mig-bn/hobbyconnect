'use client'

import type { Activity } from '@/types'

type Props = {
  activity: Activity
  isSelected?: boolean
  onClick: () => void
}

export default function ActivityCard({ activity, isSelected, onClick }: Props) {
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

  // Use first category for primary color/emoji
  const allCats = activity.categories ?? (activity.category ? [activity.category] : [])
  const primaryCat = allCats[0]
  const primaryColor = primaryCat?.color ?? '#6b7280'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-blue-400 bg-blue-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Primary category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: primaryColor + '25' }}
        >
          {primaryCat?.emoji ?? '📌'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {activity.title}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            📍 {activity.location_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            🗓 {dateStr} · {timeStr}
          </p>

          {/* Category chips */}
          {allCats.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {allCats.map(cat => (
                <span
                  key={cat.id}
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.emoji} {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                spotsLeft > 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              👥 {spotsLeft > 0 ? `${spotsLeft} cupos` : 'Lleno'}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activity.is_free
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {activity.is_free ? '🆓 Gratis' : `💰 $${activity.cost}`}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
