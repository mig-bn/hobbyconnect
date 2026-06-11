'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: 'new_participant' | 'reminder' | 'friend_request' | 'activity_invitation' | 'team_invitation'
  message: string
  activityTitle: string
  activityId: string
  time: Date
  read: boolean
  href?: string
}

type Props = { userId: string }

export default function NotificationBell({ userId }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // Ref to know which activities belong to this user (for filtering realtime events)
  const myActivityIdsRef = useRef<string[]>([])

  const unread = notifications.filter(n => !n.read).length

  const addNotification = (n: Omit<Notification, 'read'>) =>
    setNotifications(prev => {
      if (prev.some(p => p.id === n.id)) return prev
      return [{ ...n, read: false }, ...prev.slice(0, 19)]
    })

  // ── Load my activities + check 2-hour reminders ──────────────────────────
  useEffect(() => {
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    async function loadAndCheck() {
      // Activities I created
      const { data: created } = await supabase
        .from('activities')
        .select('id, title, scheduled_at')
        .eq('creator_id', userId)
        .eq('status', 'open')

      if (created) {
        myActivityIdsRef.current = created.map(a => a.id)
        // Reminder for activities starting within 2 hours
        created
          .filter(a => {
            const t = new Date(a.scheduled_at)
            return t >= now && t <= twoHoursLater
          })
          .forEach(a =>
            addNotification({
              id: `reminder-created-${a.id}`,
              type: 'reminder',
              message: 'Tu actividad comienza en menos de 2 horas',
              activityTitle: a.title,
              activityId: a.id,
              time: now,
            })
          )
      }

      // Activities I joined (for my own reminder)
      const { data: joined } = await supabase
        .from('activity_participants')
        .select('activity_id, activity:activities!inner(id, title, scheduled_at)')
        .eq('user_id', userId)

      joined
        ?.map(j => j.activity as unknown as { id: string; title: string; scheduled_at: string })
        .filter(a => {
          if (!a) return false
          const t = new Date(a.scheduled_at)
          return t >= now && t <= twoHoursLater
        })
        .forEach(a =>
          addNotification({
            id: `reminder-joined-${a.id}`,
            type: 'reminder',
            message: 'Una actividad en la que participas empieza pronto',
            activityTitle: a.title,
            activityId: a.id,
            time: now,
          })
        )
    }

    loadAndCheck()

    // Load pending friend requests
    async function loadFriendRequests() {
      const { data } = await supabase
        .from('friendships')
        .select('id, requester:profiles!friendships_requester_id_fkey(username, full_name)')
        .eq('addressee_id', userId)
        .eq('status', 'pending')

      ;(data ?? []).forEach((f: any) => {
        const name = f.requester?.full_name || `@${f.requester?.username}` || 'Alguien'
        addNotification({
          id: `friend-req-${f.id}`,
          type: 'friend_request',
          message: `${name} quiere ser tu amigo`,
          activityTitle: '',
          activityId: '',
          href: '/friends',
          time: now,
        })
      })
    }
    loadFriendRequests()

    // Load pending activity invitations
    async function loadInvitations() {
      const { data } = await supabase
        .from('activity_invitations')
        .select('id, activity:activities(title, id), inviter:profiles!activity_invitations_inviter_id_fkey(username, full_name)')
        .eq('invitee_id', userId)
        .eq('status', 'pending')

      ;(data ?? []).forEach((inv: any) => {
        const name = inv.inviter?.full_name || `@${inv.inviter?.username}` || 'Alguien'
        addNotification({
          id: `inv-${inv.id}`,
          type: 'activity_invitation',
          message: `${name} te invitó a una actividad`,
          activityTitle: inv.activity?.title ?? '',
          activityId: inv.activity?.id ?? '',
          href: '/friends',
          time: now,
        })
      })
    }
    loadInvitations()

    // Load pending team invitations
    async function loadTeamInvitations() {
      const { data } = await supabase
        .from('team_members')
        .select('id, team:teams(name, emoji), inviter:profiles!team_members_invited_by_fkey(username, full_name)')
        .eq('user_id', userId)
        .eq('status', 'pending')

      ;(data ?? []).forEach((tm: any) => {
        const name = tm.inviter?.full_name || `@${tm.inviter?.username}` || 'Alguien'
        const teamName = tm.team?.name ?? 'un equipo'
        const teamEmoji = tm.team?.emoji ?? '🏆'
        addNotification({
          id: `team-inv-${tm.id}`,
          type: 'team_invitation',
          message: `${name} te invitó al equipo ${teamEmoji} ${teamName}`,
          activityTitle: '',
          activityId: '',
          href: '/teams',
          time: now,
        })
      })
    }
    loadTeamInvitations()
  }, [userId, supabase])

  // ── Realtime: new friend requests ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`friend-requests:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'friendships', filter: `addressee_id=eq.${userId}` },
        async payload => {
          const { id, requester_id } = payload.new as { id: string; requester_id: string }
          const { data: profile } = await supabase.from('profiles').select('username, full_name').eq('id', requester_id).single()
          const name = profile?.full_name || `@${profile?.username}` || 'Alguien'
          addNotification({
            id: `friend-req-${id}`,
            type: 'friend_request',
            message: `${name} quiere ser tu amigo`,
            activityTitle: '',
            activityId: '',
            href: '/friends',
            time: new Date(),
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // ── Realtime: activity invitations ─────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`invitations:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_invitations', filter: `invitee_id=eq.${userId}` },
        async payload => {
          const { id, activity_id, inviter_id } = payload.new as { id: string; activity_id: string; inviter_id: string }
          const [{ data: activity }, { data: inviter }] = await Promise.all([
            supabase.from('activities').select('title').eq('id', activity_id).single(),
            supabase.from('profiles').select('username, full_name').eq('id', inviter_id).single(),
          ])
          const name = inviter?.full_name || `@${inviter?.username}` || 'Alguien'
          addNotification({
            id: `inv-${id}`,
            type: 'activity_invitation',
            message: `${name} te invitó a una actividad`,
            activityTitle: activity?.title ?? '',
            activityId: activity_id,
            href: '/friends',
            time: new Date(),
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // ── Realtime: team invitations ────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`team-invitations:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_members', filter: `user_id=eq.${userId}` },
        async payload => {
          const { id, team_id, invited_by } = payload.new as { id: string; team_id: string; invited_by: string }
          const [{ data: team }, { data: inviter }] = await Promise.all([
            supabase.from('teams').select('name, emoji').eq('id', team_id).single(),
            supabase.from('profiles').select('username, full_name').eq('id', invited_by).single(),
          ])
          const name = inviter?.full_name || `@${inviter?.username}` || 'Alguien'
          const teamName = team?.name ?? 'un equipo'
          const teamEmoji = team?.emoji ?? '🏆'
          addNotification({
            id: `team-inv-${id}`,
            type: 'team_invitation',
            message: `${name} te invitó al equipo ${teamEmoji} ${teamName}`,
            activityTitle: '',
            activityId: '',
            href: '/teams',
            time: new Date(),
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // ── Realtime: new participant in one of my activities ────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:user:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_participants' },
        async payload => {
          const { activity_id, user_id } = payload.new as {
            activity_id: string
            user_id: string
          }
          // Ignore if it's me joining, or activity isn't mine
          if (user_id === userId) return
          if (!myActivityIdsRef.current.includes(activity_id)) return

          const [{ data: activity }, { data: profile }] = await Promise.all([
            supabase.from('activities').select('title').eq('id', activity_id).single(),
            supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', user_id)
              .single(),
          ])

          if (!activity) return
          const who = profile?.full_name || `@${profile?.username}` || 'Alguien'

          addNotification({
            id: `join-${activity_id}-${user_id}`,
            type: 'new_participant',
            message: `${who} se unió a tu actividad`,
            activityTitle: activity.title,
            activityId: activity_id,
            time: new Date(),
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const fmtTime = (d: Date) => {
    const mins = Math.floor((Date.now() - d.getTime()) / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins}m`
    return `Hace ${Math.floor(mins / 60)}h`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setOpen(v => !v)
          if (!open && unread > 0) setTimeout(markAllRead, 1500)
        }}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        title="Notificaciones"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-base">
                      {n.type === 'new_participant' ? '👤'
                        : n.type === 'friend_request' ? '🤝'
                        : n.type === 'activity_invitation' ? '🎯'
                        : n.type === 'team_invitation' ? '🏆'
                        : '⏰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.href ? (
                        <Link href={n.href} onClick={() => setOpen(false)}>
                          <p className="text-sm text-gray-800 leading-snug hover:text-blue-600">{n.message}</p>
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                      )}
                      {n.activityTitle && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{n.activityTitle}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtTime(n.time)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
