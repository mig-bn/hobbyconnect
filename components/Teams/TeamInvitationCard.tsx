'use client'

import { useState } from 'react'
import { respondToTeamInvitation } from '@/app/actions/teams'
import type { Team, TeamMember } from '@/types'

type Props = {
  memberId: string
  team: Team & { members?: (TeamMember & { profile?: { username: string; full_name: string | null; avatar_url: string | null } })[] }
  inviterName: string
}

export default function TeamInvitationCard({ memberId, team, inviterName }: Props) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [done, setDone] = useState(false)

  const handle = async (accept: boolean) => {
    setLoading(accept ? 'accept' : 'decline')
    await respondToTeamInvitation(memberId, accept)
    setDone(true)
    setLoading(null)
  }

  if (done) return null

  const acceptedMembers = (team.members ?? []).filter(m => m.status === 'accepted').slice(0, 5)

  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Team avatar */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
          style={{ backgroundColor: team.color + '22', border: `2px solid ${team.color}` }}
        >
          {team.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900">{team.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {inviterName} te invitó a unirte
          </p>
          {team.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{team.description}</p>
          )}

          {/* Members preview */}
          {acceptedMembers.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex -space-x-1.5">
                {acceptedMembers.map(m => {
                  const name = m.profile?.full_name || `@${m.profile?.username}` || '?'
                  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 1).join('').toUpperCase()
                  return m.profile?.avatar_url ? (
                    <img
                      key={m.id}
                      src={m.profile.avatar_url}
                      alt={name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                    />
                  ) : (
                    <div
                      key={m.id}
                      className="w-5 h-5 rounded-full ring-1 ring-white flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      {initials}
                    </div>
                  )
                })}
              </div>
              <span className="text-xs text-gray-400">{acceptedMembers.length} miembro{acceptedMembers.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handle(true)}
          disabled={!!loading}
          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading === 'accept' ? '...' : 'Aceptar'}
        </button>
        <button
          onClick={() => handle(false)}
          disabled={!!loading}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {loading === 'decline' ? '...' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}
