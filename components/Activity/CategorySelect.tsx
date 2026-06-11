'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

// ─── Synonym map: searching these words also finds related categories ──────────
const SYNONYMS: Record<string, string[]> = {
  deporte:    ['fútbol', 'tenis', 'baloncesto', 'natación', 'atletismo', 'ciclismo', 'surf', 'béisbol', 'volleyball', 'rugby', 'hockey', 'boxeo', 'judo'],
  sport:      ['fútbol', 'tenis', 'baloncesto', 'natación', 'atletismo', 'ciclismo'],
  ejercicio:  ['fútbol', 'tenis', 'baloncesto', 'yoga', 'natación', 'ciclismo', 'crossfit', 'gimnasio', 'atletismo'],
  fitness:    ['yoga', 'crossfit', 'gimnasio', 'atletismo', 'ciclismo', 'natación'],
  actividad:  ['fútbol', 'tenis', 'baloncesto', 'arte', 'música', 'lectura'],
  cultura:    ['arte', 'música', 'lectura', 'teatro', 'cine', 'fotografía'],
  arte:       ['pintura', 'dibujo', 'fotografía', 'teatro', 'escultura'],
  musica:     ['música', 'concierto', 'banda', 'instrumento', 'canto'],
  pelota:     ['fútbol', 'baloncesto', 'béisbol', 'volleyball', 'rugby'],
  agua:       ['natación', 'surf', 'kayak', 'vela'],
  naturaleza: ['senderismo', 'camping', 'ciclismo', 'escalada'],
  social:     ['lectura', 'arte', 'música', 'cocina', 'juegos'],
}

// ─── Colors ────────────────────────────────────────────────────────────────────
const COLORS = [
  '#22c55e', '#16a34a', '#eab308', '#f97316', '#ef4444',
  '#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#14b8a6',
  '#f59e0b', '#84cc16', '#6366f1', '#8b5cf6', '#64748b',
]

// ─── Emojis organized by group ─────────────────────────────────────────────────
const EMOJI_GROUPS = [
  {
    label: 'Deportes de pelota',
    emojis: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏉', '🎱', '🏸', '🏓', '🥏'],
  },
  {
    label: 'Deportes y fitness',
    emojis: ['🏊', '🚴', '🏃', '🧘', '🏋️', '🤸', '⛷️', '🏄', '🧗', '🚵', '🤽', '🏇', '🛹', '🥊', '🤼', '🤺', '🏹', '🥋'],
  },
  {
    label: 'Arte y cultura',
    emojis: ['🎨', '🎭', '🎬', '📷', '🖼️', '✏️', '🖌️', '📸', '🎪', '🎠'],
  },
  {
    label: 'Música',
    emojis: ['🎵', '🎶', '🎤', '🎸', '🎹', '🎺', '🎻', '🥁', '🎷', '🪗'],
  },
  {
    label: 'Social y juegos',
    emojis: ['🎮', '🎲', '🧩', '🎯', '🃏', '♟️', '🎡', '🎢', '🎪'],
  },
  {
    label: 'Naturaleza y aire libre',
    emojis: ['🌲', '🏕️', '⛺', '🧭', '🏔️', '🌊', '🌅', '🌿', '🏖️', '🪂'],
  },
  {
    label: 'Gastronomía y social',
    emojis: ['🍳', '🍕', '☕', '🥘', '🍻', '🥗', '🍜', '🍣'],
  },
  {
    label: 'Conocimiento',
    emojis: ['📚', '🔬', '💻', '🎓', '🌍', '✈️', '🗺️', '🔭'],
  },
]

type Props = {
  categories: Category[]
  value: string[]
  onChange: (ids: string[]) => void
  onCategoryCreated?: (cat: Category) => void
}

export default function CategorySelect({ categories: initialCategories, value, onChange, onCategoryCreated }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  // ─── Fuzzy search: name + tags + synonyms ──────────────────────────────────
  const filtered = (() => {
    if (!search.trim()) return categories

    const q = search.toLowerCase().trim()

    // Direct name/tag match
    const direct = categories.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(q)
      const tagMatch = (c.tags ?? []).some(t => t.toLowerCase().includes(q))
      return nameMatch || tagMatch
    })

    // Synonym expansion: if query matches a synonym key, also include related category names
    const synonymNames: string[] = []
    for (const [key, related] of Object.entries(SYNONYMS)) {
      if (key.includes(q) || q.includes(key)) {
        synonymNames.push(...related)
      }
    }
    const synonymMatches = synonymNames.length > 0
      ? categories.filter(c =>
          synonymNames.some(s => c.name.toLowerCase().includes(s)) &&
          !direct.find(d => d.id === c.id)
        )
      : []

    return [...direct, ...synonymMatches]
  })()

  const selectedCategories = categories.filter(c => value.includes(c.id))

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: newName.trim(),
        emoji: newEmoji || '📌',
        color: newColor,
        tags: [],
      })
      .select()
      .single()
    if (!error && data) {
      setCategories(prev => [...prev, data])
      onChange([...value, data.id])
      onCategoryCreated?.(data)
      setCreating(false)
      setNewName('')
      setNewEmoji('')
      setOpen(false)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-2" ref={ref}>
      {/* Selected chips */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategories.map(cat => (
            <span
              key={cat.id}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: cat.color }}
            >
              {cat.emoji && <span>{cat.emoji}</span>}
              <span>{cat.name}</span>
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-left bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <span className="text-gray-400">
            {selectedCategories.length === 0
              ? 'Buscar y agregar categorías...'
              : `${selectedCategories.length} categoría${selectedCategories.length > 1 ? 's' : ''} seleccionada${selectedCategories.length > 1 ? 's' : ''}`}
          </span>
          <span className="ml-auto text-gray-400 text-xs">▾</span>
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {!creating ? (
              <>
                {/* Search */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder='Busca: "deporte", "arte", "fútbol"...'
                    className="w-full px-3 py-1.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {search && filtered.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 px-1">
                      {filtered.length} resultado{filtered.length > 1 ? 's' : ''} para &quot;{search}&quot;
                    </p>
                  )}
                </div>

                {/* List */}
                <div className="max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400 text-center">
                      Sin resultados para &quot;{search}&quot;
                    </p>
                  ) : (
                    filtered.map(cat => {
                      const isSelected = value.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggle(cat.id)}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat.emoji && <span>{cat.emoji}</span>}
                          <span className="flex-1 text-left">{cat.name}</span>
                          {(cat.tags ?? []).length > 0 && !isSelected && (
                            <span className="text-xs text-gray-300 truncate max-w-[80px]">
                              {cat.tags!.slice(0, 2).join(', ')}
                            </span>
                          )}
                          {isSelected && (
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Create new */}
                <div className="p-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <span className="text-base leading-none">+</span> Crear nueva categoría
                  </button>
                </div>
              </>
            ) : (
              /* Create form */
              <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700">Nueva categoría</p>

                {/* Name */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Nombre <span className="text-red-500">*</span></label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="ej. Surf, Yoga, Cocina..."
                    maxLength={30}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Emoji (optional) */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Emoji <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>

                  {/* Custom emoji input */}
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={e => setNewEmoji(e.target.value.slice(0, 2))}
                    placeholder="Escribe o pega un emoji..."
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  />

                  {/* Emoji grid by group */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {EMOJI_GROUPS.map(group => (
                      <div key={group.label}>
                        <p className="text-xs text-gray-400 mb-1">{group.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.emojis.map(e => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => setNewEmoji(e)}
                              className={`w-8 h-8 text-base rounded-lg flex items-center justify-center transition-all ${
                                newEmoji === e
                                  ? 'bg-blue-100 ring-2 ring-blue-400 scale-110'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          newColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {newName && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Vista previa:</span>
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: newColor }}
                    >
                      {newEmoji || '📌'} {newName}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setNewName(''); setNewEmoji('') }}
                    className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newName.trim() || saving}
                    className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {saving ? 'Guardando...' : 'Crear'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
