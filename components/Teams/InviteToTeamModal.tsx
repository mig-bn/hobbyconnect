'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { inviteToTeam } from '@/app/actions/teams'
import type { Profile, Team } from '@/types'

type Props = {
  team: Team
  currentUserId: string
  isOpen: boolean
  onClose: () => void
}

export default function InviteToTeamModal({ team, currentUserId, isOpen, onClose }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [inviting, setInviting] = useState<string | null>(null)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load existing member IDs to avoid re-inviting
  useEffect(() => {
    if (!isOpen) return
    supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', team.id)
      .then(({ data }) => {
        setMemberIds(new Set((data ?? []).map((m: any) => m.user_id)))
      })
  }, [isOpen, team.id])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const q = query.toLowerCase().trim()
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq('id', currentUserId)
        .limit(8)
      setResults((data ?? []) as Profile[])
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  if (!isOpen) return null

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    try {
      await inviteToTeam(team.id, userId)
      setInvited(prev => new Set(Array.from(prev).concat(userId)))
    } catch (e) {
      // Already a member or declined
    }
    setInviting(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Invitar al equipo</h2>
            <p className="text-xs text-gray-500">{team.emoji} {team.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre o @usuario"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <p className="text-center text-sm text-gray-400 py-10">No se encontraron usuarios</p>
          )}
          {results.length === 0 && !query.trim() && (
            <p className="text-center text-sm text-gray-400 py-10">Busca amigos para invitarlos</p>
          )}
          {results.map(profile => {
            const name = profile.full_name || `@${profile.username}`
            const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            const alreadyMember = memberIds.has(profile.id)
            const wasInvited = invited.has(profile.id)

            return (
              <div key={profile.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400">@{profile.username}</p>
                </div>
                {alreadyMember ? (
                  <span className="text-xs text-gray-400 px-2.5 py-1 bg-gray-100 rounded-full">Ya miembro</span>
                ) : wasInvited ? (
                  <span className="text-xs text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-full">Invitado ✓</span>
                ) : (
                  <button
                    onClick={() => handleInvite(profile.id)}
                    disabled={inviting === profile.id}
                    className="text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {inviting === profile.id ? '...' : 'Invitar'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
