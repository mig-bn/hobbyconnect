'use client'

import { useState, useEffect } from 'react'
import type { Category, CreateActivityInput, Team } from '@/types'
import CategorySelect from './CategorySelect'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateActivityInput) => Promise<void>
  categories: Category[]
  userTeams?: Team[]
  lat: number
  lng: number
  address: string
}

const DEFAULT_FORM = {
  title: '',
  categoryIds: [] as string[],
  teamId: '',
  scheduledAt: '',
  maxParticipants: 10,
  description: '',
  isFree: true,
  cost: '',
}

export default function CreateActivityModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  userTeams = [],
  lat,
  lng,
  address,
}: Props) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(DEFAULT_FORM)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const set = <K extends keyof typeof DEFAULT_FORM>(key: K, value: (typeof DEFAULT_FORM)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.categoryIds.length === 0) {
      setError('Selecciona al menos una categoría')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        category_ids: form.categoryIds,
        team_id: form.teamId || undefined,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location_name: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        location_address: address || undefined,
        lat,
        lng,
        scheduled_at: new Date(form.scheduledAt).toISOString(),
        max_participants: form.maxParticipants,
        is_free: form.isFree,
        cost: form.isFree ? undefined : Number(form.cost) || 0,
      })
    } catch {
      setError('Error al crear la actividad. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const minDateTime = new Date()
  minDateTime.setMinutes(minDateTime.getMinutes() + 30)
  const minStr = minDateTime.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nueva actividad</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">
              📍 {address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="ej. Partido de fútbol 5v5 — buscamos gente"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Categorías <span className="text-red-500">*</span>
            </label>
            <CategorySelect
              categories={categories}
              value={form.categoryIds}
              onChange={ids => set('categoryIds', ids)}
            />
          </div>

          {/* Date / Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha y hora <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              min={minStr}
              value={form.scheduledAt}
              onChange={e => set('scheduledAt', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Max participants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Máximo de participantes:{' '}
              <span className="text-blue-600 font-bold">{form.maxParticipants}</span>
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={form.maxParticipants}
              onChange={e => set('maxParticipants', Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2 personas</span>
              <span>50 personas</span>
            </div>
          </div>

          {/* Cost toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Costo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('isFree', true)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.isFree
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                🆓 Gratis
              </button>
              <button
                type="button"
                onClick={() => set('isFree', false)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !form.isFree
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                💰 Con costo
              </button>
            </div>
            {!form.isFree && (
              <div className="mt-2 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.cost}
                  onChange={e => set('cost', e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Cuéntanos más: nivel requerido, qué llevar, dónde encontrarse..."
              rows={3}
              maxLength={500}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Team invite */}
          {userTeams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Invitar equipo{' '}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Los miembros del equipo recibirán una invitación automática
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, teamId: '' }))}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    !form.teamId ? 'border-gray-400 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  Ninguno
                </button>
                {userTeams.map(team => {
                  const active = form.teamId === team.id
                  const acceptedCount = (team.members ?? []).filter(m => m.status === 'accepted').length
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, teamId: active ? '' : team.id }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        active ? 'border-transparent text-white shadow-sm' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                      style={active ? { backgroundColor: team.color } : {}}
                    >
                      <span>{team.emoji}</span>
                      <span>{team.name}</span>
                      <span className={`text-[10px] ${active ? 'text-white/80' : 'text-gray-400'}`}>
                        {acceptedCount > 1 ? `${acceptedCount - 1} inv.` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !form.title.trim() || form.categoryIds.length === 0 || !form.scheduledAt}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              '✓ Crear actividad'
            )}
          </button>

          <div className="h-2 sm:hidden" />
        </form>
      </div>
    </div>
  )
}
