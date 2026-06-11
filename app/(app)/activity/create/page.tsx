import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import CreateActivityForm from './CreateActivityForm'

export const metadata: Metadata = { title: 'Crear actividad — HobbyConnect' }

export default async function CreateActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: categories }, { data: memberships }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase
      .from('team_members')
      .select('role, team:teams(id, name, emoji, color, members:team_members(id, user_id, status))')
      .eq('user_id', user.id)
      .eq('status', 'accepted'),
  ])

  const userTeams = (memberships ?? []).map((m: any) => m.team).filter(Boolean)

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <CreateActivityForm
        categories={categories ?? []}
        userTeams={userTeams}
        userId={user.id}
      />
    </div>
  )
}
