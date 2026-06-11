'use client'

import Link from 'next/link'
import { useState } from 'react'
import { removeFriend } from '@/app/actions/friends'
import type { Profile } from '@/types'

type Props = {
  friendshipId: string
  profile: Profile
  activitiesShared?: number
}

export default function FriendCard({ friendshipId, profile, activitiesShared = 0 }: Props) {
  const [removing, setRemoving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const initials = (profile.full_name || profile.username)
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const handleRemove = async () => {
    setRemoving(true)
    try {
      await removeFriend(friendshipId)
    } catch {
      setRemoving(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
      {/* Avatar */}
      <Link href={`/profile/${profile.username}`} className="flex-shrink-0">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.username}
            className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
        )}
      </Link>

      {/* Info */}
      <Link href={`/profile/${profile.username}`} className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {profile.full_name || profile.username}
        </p>
        <p className="text-xs text-gray-400">@{profile.username}</p>
        {activitiesShared > 0 && (
          <p className="text-xs text-blue-500 mt-0.5">
            🎯 {activitiesShared} {activitiesShared === 1 ? 'actividad juntos' : 'actividades juntos'}
          </p>
        )}
      </Link>

      {/* Actions */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex-shrink-0 px-2.5 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          Eliminar
        </button>
      ) : (
        <div className="flex-shrink-0 flex gap-1.5">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-2.5 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            No
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="px-2.5 py-1.5 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {removing ? '...' : '¿Sí?'}
          </button>
        </div>
      )}
    </div>
  )
}
