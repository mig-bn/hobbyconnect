'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  ratedProfile: Profile
  activityId: string
  onSuccess: (score: number, comment: string) => void
}

const SCORE_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!']

export default function RatingModal({
  isOpen,
  onClose,
  ratedProfile,
  activityId,
  onSuccess,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [score, setScore] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const displayName = ratedProfile.full_name || `@${ratedProfile.username}`
  const initials = (ratedProfile.full_name || ratedProfile.username)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (score === 0) {
      setError('Selecciona una puntuación')
      return
    }
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('ratings').insert({
      rater_id: user.id,
      rated_id: ratedProfile.id,
      activity_id: activityId,
      score,
      comment: comment.trim() || null,
    })

    if (insertError) {
      const msg =
        insertError.code === '23505'
          ? 'Ya calificaste a este usuario para esta actividad'
          : insertError.message
      setError(msg)
      setLoading(false)
    } else {
      onSuccess(score, comment.trim())
      onClose()
    }
  }

  const active = hovered || score

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Calificar participante</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              ✕
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            {ratedProfile.avatar_url ? (
              <img
                src={ratedProfile.avatar_url}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                {initials}
              </div>
            )}
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-400">@{ratedProfile.username}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star selector */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                ¿Cómo fue tu experiencia?
              </p>
              <div
                className="flex justify-center gap-2"
                onMouseLeave={() => setHovered(0)}
              >
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(value)}
                    onMouseEnter={() => setHovered(value)}
                    className={`text-3xl transition-all hover:scale-125 active:scale-110 ${
                      active >= value ? '' : 'grayscale opacity-30'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-700 h-6 mt-1">
                {SCORE_LABELS[active]}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Comentario{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Cuéntanos cómo fue la experiencia..."
                rows={3}
                maxLength={300}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {comment.length}/300
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || score === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar calificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
