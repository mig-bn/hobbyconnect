'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialLink, SocialPlatform, SocialVisibility } from '@/types'
import { PLATFORM_META } from '@/types'

const PLATFORMS = Object.keys(PLATFORM_META) as SocialPlatform[]

const VISIBILITY_OPTS: { value: SocialVisibility; label: string; icon: string }[] = [
  { value: 'public',  label: 'Todos',         icon: '🌍' },
  { value: 'friends', label: 'Solo amigos',   icon: '🤝' },
  { value: 'private', label: 'Nadie (oculto)',icon: '🔒' },
]

type Props = {
  userId: string
  initialLinks: SocialLink[]
}

export default function SocialLinksEditor({ userId, initialLinks }: Props) {
  const supabase = createClient()
  const [links, setLinks] = useState<SocialLink[]>(initialLinks)
  const [adding, setAdding] = useState(false)
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('whatsapp')
  const [newHandle, setNewHandle] = useState('')
  const [newVisibility, setNewVisibility] = useState<SocialVisibility>('public')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const availablePlatforms = PLATFORMS.filter(
    p => !links.find(l => l.platform === p)
  )

  const handleAdd = async () => {
    if (!newHandle.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('social_links')
      .upsert({
        user_id: userId,
        platform: newPlatform,
        handle: newHandle.trim(),
        visibility: newVisibility,
      })
      .select()
      .single()

    if (!error && data) {
      setLinks(prev => [...prev.filter(l => l.platform !== newPlatform), data])
      setAdding(false)
      setNewHandle('')
      setNewPlatform(availablePlatforms[0] ?? 'instagram')
      setNewVisibility('public')
    }
    setSaving(false)
  }

  const handleUpdateVisibility = async (id: string, visibility: SocialVisibility) => {
    await supabase.from('social_links').update({ visibility }).eq('id', id)
    setLinks(prev => prev.map(l => l.id === id ? { ...l, visibility } : l))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('social_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-2">
      {/* Existing links */}
      {links.map(link => {
        const meta = PLATFORM_META[link.platform]
        const isEditing = editingId === link.id
        const vis = VISIBILITY_OPTS.find(v => v.value === link.visibility)!

        return (
          <div key={link.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              >
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500">{meta.label}</p>
                <p className="text-sm text-gray-900 truncate">{link.handle}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingId(isEditing ? null : link.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                {vis.icon} {vis.label}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(link.id)}
                className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Visibility selector */}
            {isEditing && (
              <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 flex gap-2">
                {VISIBILITY_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleUpdateVisibility(link.id, opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      link.visibility === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add new */}
      {adding ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2.5">
          {/* Platform selector */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Red social</p>
            <div className="grid grid-cols-5 gap-1.5">
              {availablePlatforms.map(p => {
                const m = PLATFORM_META[p]
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setNewPlatform(p); setNewHandle('') }}
                    title={m.label}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                      newPlatform === p
                        ? 'text-white border-transparent'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                    style={newPlatform === p ? { backgroundColor: m.color, borderColor: m.color } : {}}
                  >
                    <span className="text-base">{m.icon}</span>
                    <span className="text-[10px] truncate w-full text-center px-0.5">{m.label.split('/')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Handle input */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {newPlatform === 'whatsapp' ? 'Número' : newPlatform === 'email' ? 'Correo' : 'Usuario'}
            </p>
            <input
              autoFocus
              type={newPlatform === 'email' ? 'email' : 'text'}
              value={newHandle}
              onChange={e => setNewHandle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={PLATFORM_META[newPlatform].placeholder}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Visibility */}
          <div>
            <p className="text-xs text-gray-500 mb-1">¿Quién puede verlo?</p>
            <div className="flex gap-1.5">
              {VISIBILITY_OPTS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewVisibility(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    newVisibility === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setAdding(false); setNewHandle('') }}
              className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newHandle.trim() || saving}
              className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      ) : availablePlatforms.length > 0 ? (
        <button
          type="button"
          onClick={() => { setAdding(true); setNewPlatform(availablePlatforms[0]) }}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <span>+</span> Agregar red social
        </button>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">
          Has agregado todas las redes disponibles
        </p>
      )}
    </div>
  )
}
