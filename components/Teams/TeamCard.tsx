'use client'

import { useState } from 'react'
import Link from 'next/link'
import { removeTeamMember, deleteTeam, promoteToCaption } from '@/app/actions/teams'
import type { Team, TeamMember, Profile } from '@/types'
import InviteToTeamModal from './InviteToTeamModal'

type MemberRow = TeamMember & {
  profile?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
}

type Props = {
  team: Team & { members?: MemberRow[] }
  currentUserId: string
  isCreator: boolean
  isCaptain: boolean
  myMemberId: string
}

function MemberAvatar({ member, size = 8 }: { member: MemberRow; size?: number }) {
  const name = member.profile?.full_name || `@${member.profile?.username}` || '?'
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  return member.profile?.avatar_url ? (
    <img src={member.profile.avatar_url} alt={name} className={`${cls} object-cover`} />
  ) : (
    <div className={`${cls} bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold`}>
      {initials}
    </div>
  )
}

export default function TeamCard({ team, currentUserId, isCreator, isCaptain, myMemberId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const members = team.members ?? []
  const accepted = members.filter(m => m.status === 'accepted')
  const pending  = members.filter(m => m.status === 'pending')
  const canManage = isCreator || isCaptain

  const handleLeave = async () => {
    setLoading(true)
    await removeTeamMember(myMemberId)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    await deleteTeam(team.id)
    setLoading(false)
  }

  const handleKick = async (memberId: string) => {
    await removeTeamMember(memberId)
  }

  const handlePromote = async (memberId: string) => {
    await promoteToCaption(memberId)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer select-none"
          onClick={() => setExpanded(v => !v)}
        >
          {/* Team icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
            style={{ backgroundColor: team.color + '22', border: `2px solid ${team.color}` }}
          >
            {team.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 truncate">{team.name}</p>
              {(isCreator || isCaptain) && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: team.color }}>
                  {isCreator ? 'Capitán' : 'Cap.'}
                </span>
              )}
            </div>
            {team.category && (
              <p className="text-xs text-gray-500 mt-0.5">{team.category.emoji} {team.category.name}</p>
            )}
            {/* Member avatars preview */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex -space-x-1.5">
                {accepted.slice(0, 6).map(m => (
                  <div key={m.id} className="w-5 h-5 rounded-full ring-1 ring-white overflow-hidden flex-shrink-0">
                    <MemberAvatar member={m} size={5} />
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400">
                {accepted.length} miembro{accepted.length !== 1 ? 's' : ''}
                {pending.length > 0 && ` · ${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          <svg
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* Description */}
            {team.description && (
              <p className="px-4 py-3 text-sm text-gray-500 border-b border-gray-50">{team.description}</p>
            )}

            {/* Actions row */}
            <div className="flex gap-2 px-4 py-3 border-b border-gray-50">
              {canManage && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  + Invitar miembro
                </button>
              )}
              {!isCreator && (
                <button
                  onClick={handleLeave}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Salir del equipo
                </button>
              )}
              {isCreator && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                    confirmDelete
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                  }`}
                >
                  {confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar equipo'}
                </button>
              )}
            </div>

            {/* Members list */}
            <div className="divide-y divide-gray-50">
              {accepted.map(m => {
                const name = m.profile?.full_name || `@${m.profile?.username}` || 'Usuario'
                const isSelf = m.user_id === currentUserId
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <MemberAvatar member={m} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/profile/${m.profile?.username}`} className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                          {name}
                        </Link>
                        {m.role === 'captain' && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700">CAP</span>
                        )}
                        {isSelf && (
                          <span className="text-[9px] text-gray-400">(tú)</span>
                        )}
                      </div>
                      {m.profile?.username && (
                        <p className="text-xs text-gray-400">@{m.profile.username}</p>
                      )}
                    </div>
                    {canManage && !isSelf && (
                      <div className="flex gap-1">
                        {m.role !== 'captain' && (
                          <button
                            onClick={() => handlePromote(m.id)}
                            className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            title="Promover a capitán"
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          onClick={() => handleKick(m.id)}
                          className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Remover del equipo"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Pending invitations */}
              {pending.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-gray-50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Invitaciones pendientes</p>
                  </div>
                  {pending.map(m => {
                    const name = m.profile?.full_name || `@${m.profile?.username}` || 'Usuario'
                    return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 opacity-60">
                        <MemberAvatar member={m} size={8} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{name}</p>
                          <p className="text-xs text-gray-400">Pendiente de aceptar</p>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => handleKick(m.id)}
                            className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <InviteToTeamModal
        team={team}
        currentUserId={currentUserId}
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </>
  )
}
