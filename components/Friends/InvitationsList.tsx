'use client'

import { useState } from 'react'
import Link from 'next/link'
import { respondToInvitation } from '@/app/actions/friends'
import type { ActivityInvitation } from '@/types'

type Props = {
  invitations: ActivityInvitation[]
}

export default function InvitationsList({ invitations }: Props) {
  const [responded, setResponded] = useState<Record<string, 'accepted' | 'declined'>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const handleRespond = async (id: string, accept: boolean) => {
    setLoading(id)
    try {
      await respondToInvitation(id, accept)
      setResponded(prev => ({ ...prev, [id]: accept ? 'accepted' : 'declined' }))
    } catch { /* error */ }
    setLoading(null)
  }

  return (
    <div className="space-y-2">
      {invitations.map(inv => {
        const response = responded[inv.id]
        const activity = inv.activity as any
        const inviter = inv.inviter as any
        const cats = (activity?.activity_categories ?? []).map((ac: any) => ac.categories).filter(Boolean)
        const primaryColor = cats[0]?.color ?? '#3b82f6'
        const inviterName = inviter?.full_name || `@${inviter?.username}` || 'Alguien'

        return (
          <div key={inv.id}
            className={`p-4 bg-white rounded-2xl border transition-all ${
              response ? 'opacity-60 border-gray-100' : 'border-blue-100 shadow-sm'
            }`}
          >
            {/* Category pill + who invited */}
            <div className="flex items-center gap-2 mb-2">
              {cats.slice(0, 2).map((c: any) => (
                <span key={c.id}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.emoji} {c.name}
                </span>
              ))}
            </div>

            <p className="font-bold text-gray-900 text-sm leading-snug mb-0.5">
              {activity?.title ?? 'Actividad'}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              <span className="font-medium text-gray-600">{inviterName}</span> te invitó
              {activity?.scheduled_at && (
                <> · {new Date(activity.scheduled_at).toLocaleDateString('es-CO', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}</>
              )}
            </p>

            {response ? (
              <p className={`text-xs font-medium ${response === 'accepted' ? 'text-emerald-600' : 'text-gray-400'}`}>
                {response === 'accepted' ? '✓ Aceptada — ¡disfrútalo!' : '✕ Rechazada'}
              </p>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(inv.id, false)}
                  disabled={loading === inv.id}
                  className="flex-1 py-2 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleRespond(inv.id, true)}
                  disabled={loading === inv.id}
                  className="flex-1 py-2 text-xs text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  {loading === inv.id ? '...' : '¡Voy!'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
