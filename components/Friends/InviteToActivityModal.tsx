'use client'

import { useState } from 'react'
import { sendActivityInvitation } from '@/app/actions/friends'
import type { Activity, Profile } from '@/types'

type Friend = { friendshipId: string; profile: Profile }

type Props = {
  isOpen: boolean
  onClose: () => void
  activity: Activity
  friends: Friend[]
}

export default function InviteToActivityModal({ isOpen, onClose, activity, friends }: Props) {
  const [sent, setSent] = useState<string[]>([])
  const [sending, setSending] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filtered = friends.filter(f =>
    (f.profile.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    f.profile.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleInvite = async (inviteeId: string) => {
    setSending(inviteeId)
    try {
      await sendActivityInvitation(activity.id, inviteeId)
      setSent(prev => [...prev, inviteeId])
    } catch { /* already invited */ }
    setSending(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Invitar amigos</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">
              {activity.title}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar amigos..."
            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Friend list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm">
                {friends.length === 0
                  ? 'Aún no tienes amigos agregados'
                  : 'Sin resultados'}
              </p>
            </div>
          ) : (
            filtered.map(({ friendshipId, profile }) => {
              const isSent = sent.includes(profile.id)
              const initials = (profile.full_name || profile.username)
                .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={profile.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  {/* Avatar */}
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {profile.full_name || profile.username}
                    </p>
                    <p className="text-xs text-gray-400">@{profile.username}</p>
                  </div>

                  {isSent ? (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium flex-shrink-0">
                      ✓ Invitado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleInvite(profile.id)}
                      disabled={sending === profile.id}
                      className="flex-shrink-0 px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {sending === profile.id ? '...' : 'Invitar'}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            {sent.length > 0
              ? `✓ ${sent.length} ${sent.length === 1 ? 'invitación enviada' : 'invitaciones enviadas'}`
              : 'Los amigos recibirán una notificación'}
          </p>
        </div>
      </div>
    </div>
  )
}
