'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Create a team + auto-add creator as captain ──────────────────────────────
export async function createTeam(data: {
  name: string
  description?: string
  emoji: string
  color: string
  category_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      emoji: data.emoji,
      color: data.color,
      creator_id: user.id,
      category_id: data.category_id || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Auto-add creator as accepted captain
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: 'captain',
      status: 'accepted',
      invited_by: user.id,
    })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/teams')
  return team
}

// ─── Invite a user to a team ──────────────────────────────────────────────────
export async function inviteToTeam(teamId: string, inviteeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: inviteeId,
      role: 'member',
      status: 'pending',
      invited_by: user.id,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/teams')
}

// ─── Accept or decline a team invitation ──────────────────────────────────────
export async function respondToTeamInvitation(memberId: string, accept: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('team_members')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', memberId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/teams')
}

// ─── Remove a member from a team (or leave) ───────────────────────────────────
export async function removeTeamMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)

  if (error) throw new Error(error.message)
  revalidatePath('/teams')
}

// ─── Promote member to captain ────────────────────────────────────────────────
export async function promoteToCaption(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('team_members')
    .update({ role: 'captain' })
    .eq('id', memberId)

  if (error) throw new Error(error.message)
  revalidatePath('/teams')
}

// ─── Delete a team (creator only) ────────────────────────────────────────────
export async function deleteTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)
    .eq('creator_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/teams')
}

// ─── Invite all accepted team members to an activity ─────────────────────────
export async function inviteTeamToActivity(activityId: string, teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Get all accepted members (excluding the inviter/creator themselves)
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('status', 'accepted')
    .neq('user_id', user.id)

  if (!members || members.length === 0) return

  // Bulk insert invitations (ignore duplicates)
  const invitations = members.map(m => ({
    activity_id: activityId,
    inviter_id: user.id,
    invitee_id: m.user_id,
    status: 'pending',
  }))

  await supabase
    .from('activity_invitations')
    .upsert(invitations, { onConflict: 'activity_id,invitee_id', ignoreDuplicates: true })
}
