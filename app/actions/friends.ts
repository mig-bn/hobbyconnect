'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' })

  if (error) throw new Error(error.message)
  revalidatePath('/friends')
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('friendships')
    .update({ status: accept ? 'accepted' : 'rejected', updated_at: new Date().toISOString() })
    .eq('id', friendshipId)
    .eq('addressee_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/friends')
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) throw new Error(error.message)
  revalidatePath('/friends')
}

export async function sendActivityInvitation(activityId: string, inviteeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('activity_invitations')
    .insert({ activity_id: activityId, inviter_id: user.id, invitee_id: inviteeId, status: 'pending' })

  if (error) throw new Error(error.message)
}

export async function respondToInvitation(invitationId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('activity_invitations')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', invitationId)
    .eq('invitee_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/friends')
}
