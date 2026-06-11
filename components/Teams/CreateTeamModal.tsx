'use client'

import { useState } from 'react'
import { createTeam } from '@/app/actions/teams'
import type { Category } from '@/types'

const TEAM_EMOJIS = [
  '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🏓','🏸','🥊',
  '🏊','🚴','🏋️','🤸','🎯','🎮','🎭','🎨','🎸','🎲',
  '🦁','🐯','🦅','🐺','🦊','🐉','🦋','⚡','🔥','💎',
]

const TEAM_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#ef4444',
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#06b6d4','#64748b','#000000',
]

type Props = {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export default function CreateTeamModal({ isOpen, onClose, categories }: Props) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    emoji: '⚽',
    color: '#3b82f6',
    category_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      await createTeam({
        name: form.name,
        description: form.description || undefined,
        emoji: form.emoji,
        color: form.color,
        category_id: form.category_id || undefined,
      })
      onClose()
      setForm({ name: '', description: '', emoji: '⚽', color: '#3b82f6', category_id: '' })
    } catch (e: any) {
      setError(e.message ?? 'Error al crear el equipo')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Crear equipo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm flex-shrink-0"
              style={{ backgroundColor: form.color + '22', border: `2px solid ${form.color}` }}
            >
              {form.emoji}
            </div>
            <div>
              <p className="font-bold text-gray-900">{form.name || 'Nombre del equipo'}</p>
              {form.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{form.description}</p>}
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ícono del equipo</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, emoji: e }))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all ${
                    form.emoji === e ? 'ring-2 ring-blue-500 bg-blue-50 scale-110' : 'hover:bg-gray-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del equipo *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Barsa Futbolito"
              maxLength={50}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="¿De qué va tu equipo? Nivel, frecuencia, etc."
              rows={2}
              maxLength={200}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Sport/category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deporte / categoría <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, category_id: '' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !form.category_id ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Ninguna
              </button>
              {categories.map(cat => {
                const active = form.category_id === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, category_id: active ? '' : cat.id }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={active ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </span>
            ) : 'Crear equipo'}
          </button>
        </div>
      </div>
    </div>
  )
}
