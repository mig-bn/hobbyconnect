'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import NotificationBell from '@/components/Notifications/NotificationBell'
import type { Profile } from '@/types'

type Props = { profile: Profile }

function UserAvatar({
  profile,
  size = 'sm',
}: {
  profile: Profile
  size?: 'sm' | 'md'
}) {
  const initials = (profile.full_name || profile.username)
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.username}
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

export default function Navbar({ profile }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/map',     label: 'Mapa',    icon: '🗺️' },
    { href: '/feed',    label: 'Feed',    icon: '📋' },
    { href: '/friends', label: 'Amigos',  icon: '🤝' },
    { href: '/teams',   label: 'Equipos', icon: '🏆' },
  ]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0 z-30 sticky top-0">
      {/* Logo */}
      <Link
        href="/map"
        className="flex items-center gap-2 font-bold text-gray-900 mr-2 flex-shrink-0"
      >
        <span className="text-xl">🎯</span>
        <span className="hidden sm:block text-base tracking-tight">HobbyConnect</span>
      </Link>

      {/* Desktop nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(link.href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Create activity CTA */}
      <Link
        href="/activity/create"
        className={`hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
          pathname.startsWith('/activity/create')
            ? 'bg-blue-700 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <span className="text-base leading-none">+</span>
        <span>Actividad</span>
      </Link>
      <Link
        href="/activity/create"
        className={`flex md:hidden items-center justify-center w-9 h-9 rounded-xl text-lg font-bold transition-colors ${
          pathname.startsWith('/activity/create')
            ? 'bg-blue-700 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title="Crear actividad"
      >
        +
      </Link>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center gap-0.5">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-2 rounded-lg text-lg transition-colors ${
              pathname.startsWith(link.href) ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
          >
            {link.icon}
          </Link>
        ))}
      </nav>

      {/* Bell */}
      <NotificationBell userId={profile.id} />

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-1.5 p-1 pr-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <UserAvatar profile={profile} />
          <svg
            className="w-3.5 h-3.5 text-gray-400 hidden sm:block"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <UserAvatar profile={profile} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {profile.full_name || profile.username}
                </p>
                <p className="text-xs text-gray-500">@{profile.username}</p>
              </div>
            </div>

            <Link
              href={`/profile/${profile.username}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="text-base">👤</span>
              Mi perfil
            </Link>

            <div className="border-t border-gray-100">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
