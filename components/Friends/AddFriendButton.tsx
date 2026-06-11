'use client'

import { useState } from 'react'
import { sendFriendRequest, removeFriend } from '@/app/actions/friends'

type Props = {
  profileId: string
  friendshipId: string | null
  friendshipStatus: string | null
  isRequester: boolean
}

export default function AddFriendButton({ profileId, friendshipId, friendshipStatus, isRequester }: Props) {
  const [status, setStatus] = useState(friendshipStatus)
  const [fsId, setFsId] = useState(friendshipId)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    try {
      await sendFriendRequest(profileId)
      setStatus('pending')
    } catch { /* already sent */ }
    setLoading(false)
  }

  const handleRemove = async () => {
    if (!fsId) return
    setLoading(true)
    try {
      await removeFriend(fsId)
      setStatus(null)
      setFsId(null)
    } catch { /* error */ }
    setLoading(false)
  }

  if (status === 'accepted') {
    return (
      <button
        onClick={handleRemove}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 group"
      >
        <span className="group-hover:hidden">✓ Amigos</span>
        <span className="hidden group-hover:inline">✕ Eliminar amigo</span>
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
        {isRequester ? '⏳ Solicitud enviada' : '📩 Te envió una solicitud — ve a Amigos'}
      </span>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        '+ Agregar amigo'
      )}
    </button>
  )
}
