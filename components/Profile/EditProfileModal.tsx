'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Profile, SocialLink } from '@/types'
import { useRouter } from 'next/navigation'
import SocialLinksEditor from './SocialLinksEditor'

type Props = {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  categories: Category[]
  socialLinks?: SocialLink[]
}

export default function EditProfileModal({ isOpen, onClose, profile, categories, socialLinks = [] }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    bio: profile.bio || '',
    city: profile.city || 'Barranquilla',
    interests: profile.interests || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const toggleInterest = (catId: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(catId)
        ? prev.interests.filter(id => id !== catId)
        : [...prev.interests, catId],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim() || null,
        bio: form.bio.trim() || null,
        city: form.city.trim() || 'Barranquilla',
        interests: form.interests,
      })
      .eq('id', profile.id)

    if (error) {
      setError('Error al guardar. Intenta de nuevo.')
      setSaving(false)
    } else {
      router.refresh()
      onClose()
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Editar perfil</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Tu nombre"
              maxLength={80}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ciudad
            </label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              placeholder="Barranquilla"
              maxLength={50}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Biografía{' '}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Cuéntanos sobre ti, qué actividades disfrutas..."
              rows={3}
              maxLength={300}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/300</p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mis intereses
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Selecciona las categorías que te gustan
            </p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => {
                const active = form.interests.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white'
                    }`}
                    style={active ? { backgroundColor: cat.color } : {}}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Social links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redes sociales
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Agrega cómo contactarte. Puedes controlar quién lo ve.
            </p>
            <SocialLinksEditor userId={profile.id} initialLinks={socialLinks} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
