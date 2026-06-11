'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  activityId: string
  userId: string
  isParticipant: boolean
  isFull: boolean
}

export default function ActivityDetailClient({
  activityId,
  userId,
  isParticipant: initialIsParticipant,
  isFull,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [joined, setJoined] = useState(initialIsParticipant)
  const [loading, setLoading] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const handleJoin = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('activity_participants')
      .insert({ activity_id: activityId, user_id: userId })
    if (!error) {
      setJoined(true)
      router.refresh()
    }
    setLoading(false)
  }

  const handleLeave = async () => {
    if (!confirmLeave) { setConfirmLeave(true); return }
    setLoading(true)
    await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', userId)
    setJoined(false)
    setConfirmLeave(false)
    router.refresh()
    setLoading(false)
  }

  if (joined) {
    return (
      <div className="mb-4 flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
          ✓ Eres participante de esta actividad
        </div>
        <button
          onClick={handleLeave}
          disabled={loading}
          className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
            confirmLeave
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
          }`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin block" />
          ) : confirmLeave ? (
            '¿Confirmar salida?'
          ) : (
            'Abandonar'
          )}
        </button>
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="mb-4 w-full py-3 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold text-center">
        Actividad llena — sin cupos disponibles
      </div>
    )
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="mb-4 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Uniéndose...
        </>
      ) : (
        '+ Unirme a esta actividad'
      )}
    </button>
  )
}
