import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import FriendCard from '@/components/Friends/FriendCard'
import FriendRequestCard from '@/components/Friends/FriendRequestCard'
import AddFriendSearch from '@/components/Friends/AddFriendSearch'
import InvitationsList from '@/components/Friends/InvitationsList'

export const metadata: Metadata = { title: 'Amigos — HobbyConnect' }

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // My friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('updated_at', { ascending: false })

  const accepted  = (friendships ?? []).filter(f => f.status === 'accepted')
  const received  = (friendships ?? []).filter(f => f.status === 'pending' && f.addressee_id === user.id)
  const sent      = (friendships ?? []).filter(f => f.status === 'pending' && f.requester_id === user.id)

  // IDs of all friends (for search exclusion)
  const friendIds = accepted.map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )

  // Pending activity invitations I received
  const { data: activityInvitations } = await supabase
    .from('activity_invitations')
    .select('*, activity:activities(*, activity_categories(categories(*))), inviter:profiles!activity_invitations_inviter_id_fkey(*)')
    .eq('invitee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amigos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona tu red y organiza actividades juntos
          </p>
        </div>

        {/* ── Activity invitations ── */}
        {(activityInvitations ?? []).length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                {activityInvitations!.length}
              </span>
              Invitaciones a actividades
            </h2>
            <InvitationsList invitations={activityInvitations as any} />
          </section>
        )}

        {/* ── Friend requests received ── */}
        {received.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">
                {received.length}
              </span>
              Solicitudes recibidas
            </h2>
            <div className="space-y-2">
              {received.map(f => (
                <FriendRequestCard
                  key={f.id}
                  friendshipId={f.id}
                  profile={f.requester}
                  type="received"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Buscar amigos ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Buscar personas</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <AddFriendSearch
              currentUserId={user.id}
              friendIds={[...friendIds, ...sent.map(f => f.addressee_id)]}
            />
          </div>
        </section>

        {/* ── My friends ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Mis amigos
            <span className="ml-2 text-xs font-normal text-gray-400">
              {accepted.length} {accepted.length === 1 ? 'persona' : 'personas'}
            </span>
          </h2>

          {accepted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">🤝</p>
              <p className="text-sm font-medium text-gray-500">Aún no tienes amigos</p>
              <p className="text-xs mt-1">Usa el buscador para encontrar personas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {accepted.map(f => {
                const friend = f.requester_id === user.id ? f.addressee : f.requester
                return (
                  <FriendCard
                    key={f.id}
                    friendshipId={f.id}
                    profile={friend}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* ── Sent requests ── */}
        {sent.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 text-gray-400">
              Solicitudes enviadas
            </h2>
            <div className="space-y-2">
              {sent.map(f => (
                <FriendRequestCard
                  key={f.id}
                  friendshipId={f.id}
                  profile={f.addressee}
                  type="sent"
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
