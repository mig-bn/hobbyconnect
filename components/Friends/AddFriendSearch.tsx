'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendFriendRequest } from '@/app/actions/friends'
import Link from 'next/link'
import type { Profile } from '@/types'

type Result = Profile & { friendship_status?: string }

export default function AddFriendSearch({ currentUserId, friendIds }: {
  currentUserId: string
  friendIds: string[]
}) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [searching, setSearching] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [sending, setSending] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(8)

      setResults(data ?? [])
      setSearching(false)
    }, 350)
  }, [query, currentUserId, supabase])

  const handleSend = async (profileId: string) => {
    setSending(profileId)
    try {
      await sendFriendRequest(profileId)
      setSent(prev => [...prev, profileId])
    } catch { /* already sent or error */ }
    setSending(null)
  }

  const getStatus = (profile: Result): 'friend' | 'sent' | 'none' => {
    if (friendIds.includes(profile.id)) return 'friend'
    if (sent.includes(profile.id)) return 'sent'
    return 'none'
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o usuario..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin block" />
          </span>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(profile => {
            const status = getStatus(profile)
            const initials = (profile.full_name || profile.username)
              .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

            return (
              <div key={profile.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                <Link href={`/profile/${profile.username}`} className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username}
                      className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                      {initials}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {profile.full_name || profile.username}
                  </p>
                  <p className="text-xs text-gray-400">@{profile.username} · {profile.city}</p>
                </div>
                <div className="flex-shrink-0">
                  {status === 'friend' ? (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">
                      ✓ Amigo
                    </span>
                  ) : status === 'sent' ? (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                      Enviada ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSend(profile.id)}
                      disabled={sending === profile.id}
                      className="text-xs text-white bg-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {sending === profile.id ? '...' : '+ Agregar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          Sin resultados para &quot;{query}&quot;
        </p>
      )}
    </div>
  )
}
