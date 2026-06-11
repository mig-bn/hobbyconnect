import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Layout/Navbar'
import type { Profile } from '@/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Profile should always exist (created by trigger), but guard just in case
  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar profile={profile as Profile} />
      <main className="flex-1 overflow-hidden min-h-0">{children}</main>
    </div>
  )
}
