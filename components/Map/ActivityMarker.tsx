'use client'

import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps'
import Link from 'next/link'
import type { Activity } from '@/types'

type Props = {
  activity: Activity
  isSelected: boolean
  onSelect: (id: string | null) => void
}

export default function ActivityMarker({ activity, isSelected, onSelect }: Props) {
  const [markerRef, marker] = useAdvancedMarkerRef()

  const date = new Date(activity.scheduled_at)
  const dateStr = date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  const spotsLeft = activity.max_participants - (activity.participants_count ?? 0)

  // Use first category for marker color
  const allCats = activity.categories ?? (activity.category ? [activity.category] : [])
  const primaryCat = allCats[0]
  const color = primaryCat?.color ?? '#6b7280'

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: activity.lat, lng: activity.lng }}
        onClick={() => onSelect(isSelected ? null : activity.id)}
        zIndex={isSelected ? 20 : 1}
        title={activity.title}
      >
        <div
          className={`
            relative flex items-center justify-center
            rounded-full border-2 border-white shadow-lg
            text-lg cursor-pointer select-none
            transition-transform duration-150
            ${isSelected ? 'w-12 h-12 scale-110' : 'w-10 h-10 hover:scale-110'}
          `}
          style={{ backgroundColor: color }}
        >
          {primaryCat?.emoji ?? '📌'}
          {spotsLeft === 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
          )}
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onSelect(null)}
          maxWidth={280}
        >
          <div className="p-1 min-w-[200px]">
            {/* Categories */}
            {allCats.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {allCats.map(cat => (
                  <span
                    key={cat.id}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.emoji} {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">
              {activity.title}
            </h3>

            {/* Details */}
            <div className="space-y-1 mb-3">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <span>📍</span>
                <span className="truncate">{activity.location_name}</span>
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <span>🗓</span>
                <span>{dateStr} · {timeStr}</span>
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-3">
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

            {/* CTA */}
            <Link
              href={`/activity/${activity.id}`}
              className="block w-full py-2 text-center text-xs font-semibold text-white rounded-lg transition-colors"
              style={{ backgroundColor: color }}
            >
              Ver actividad →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  )
}
