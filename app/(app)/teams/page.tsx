import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import type { Category } from '@/types'
import TeamCard from '@/components/Teams/TeamCard'
import TeamInvitationCard from '@/components/Teams/TeamInvitationCard'
import TeamsPageClient from './TeamsPageClient'

export const metadata: Metadata = { title: 'Equipos — HobbyConnect' }

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // My team memberships (accepted or captain)
  const { data: myMemberships } = await supabase
    .from('team_members')
    .select(`
      id, role, status, team_id,
      team:teams(
        id, name, description, emoji, color, creator_id, category_id, created_at,
        category:categories(id, name, emoji, color),
        members:team_members(
          id, user_id, role, status, invited_by, created_at,
          profile:profiles(id, username, full_name, avatar_url)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Pending invitations to me
  const { data: pendingInvitations } = await supabase
    .from('team_members')
    .select(`
      id, team_id, invited_by,
      team:teams(
        id, name, description, emoji, color, creator_id, category_id,
        members:team_members(
          id, user_id, role, status,
          profile:profiles(id, username, full_name, avatar_url)
        )
      ),
      inviter:profiles!team_members_invited_by_fkey(username, full_name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  // Categories for the create modal
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const memberships = (myMemberships ?? []).filter(m => m.status === 'accepted')

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Organiza tu crew y juega en equipo
            </p>
          </div>
          <TeamsPageClient categories={categories ?? []} />
        </div>

        {/* ── Pending invitations ── */}
        {(pendingInvitations ?? []).length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {pendingInvitations!.length}
              </span>
              Invitaciones a equipos
            </h2>
            <div className="space-y-3">
              {pendingInvitations!.map((inv: any) => {
                const inviterName = inv.inviter?.full_name || `@${inv.inviter?.username}` || 'Alguien'
                return (
                  <TeamInvitationCard
                    key={inv.id}
                    memberId={inv.id}
                    team={inv.team}
                    inviterName={inviterName}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* ── My teams ── */}
        <section>
          {memberships.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">🏟️</p>
              <p className="font-bold text-gray-700 text-lg">Aún no tienes equipos</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                Crea tu primer equipo e invita a tus amigos para organizar actividades juntos
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Mis equipos ({memberships.length})
              </h2>
              <div className="space-y-3">
                {memberships.map((m: any) => (
                  <TeamCard
                    key={m.team.id}
                    team={m.team}
                    currentUserId={user.id}
                    isCreator={m.team.creator_id === user.id}
                    isCaptain={m.role === 'captain'}
                    myMemberId={m.id}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
