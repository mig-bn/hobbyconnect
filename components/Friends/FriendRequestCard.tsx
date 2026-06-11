'use client'

import Link from 'next/link'
import { useState } from 'react'
import { respondToFriendRequest } from '@/app/actions/friends'
import type { Profile } from '@/types'

type Props = {
  friendshipId: string
  profile: Profile
  type: 'received' | 'sent'
  onCancel?: (id: string) => void
}

export default function FriendRequestCard({ friendshipId, profile, type, onCancel }: Props) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)

  const initials = (profile.full_name || profile.username)
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const handleRespond = async (accept: boolean) => {
    setLoading(accept ? 'accept' : 'reject')
    try {
      await respondToFriendRequest(friendshipId, accept)
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100">
      {/* Avatar */}
      <Link href={`/profile/${profile.username}`} className="flex-shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username}
            className="w-11 h-11 rounded-xl object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${profile.username}`}>
          <p className="font-semibold text-gray-900 text-sm truncate hover:underline">
            {profile.full_name || profile.username}
          </p>
        </Link>
        <p className="text-xs text-gray-400">@{profile.username}</p>
        {profile.city && (
          <p className="text-xs text-gray-400">🌆 {profile.city}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        {type === 'received' ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => handleRespond(false)}
              disabled={loading !== null}
              className="px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading === 'reject' ? '...' : 'Rechazar'}
            </button>
            <button
              onClick={() => handleRespond(true)}
              disabled={loading !== null}
              className="px-2.5 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading === 'accept' ? '...' : 'Aceptar'}
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1.5 rounded-lg">
            Pendiente
          </span>
        )}
      </div>
    </div>
  )
}
