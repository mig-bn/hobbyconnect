'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Ya existe una cuenta con ese email',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
}

export default function RegisterForm() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmedEmail, setConfirmedEmail] = useState(false)

  const sanitizeUsername = (v: string) =>
    v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.length < 3) {
      setError('El username debe tener al menos 3 caracteres')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      setError('Ese username ya está en uso')
      setLoading(false)
      return
    }

    // Create account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username },
      },
    })

    if (error) {
      setError(ERROR_MESSAGES[error.message] ?? error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update the profile created by the trigger with the correct username
      await supabase
        .from('profiles')
        .update({ username, full_name: fullName })
        .eq('id', data.user.id)

      if (data.session) {
        // Auto-confirm enabled → go straight to app
        router.push('/map')
        router.refresh()
      } else {
        // Email confirmation required
        setConfirmedEmail(true)
        setLoading(false)
      }
    }
  }

  if (confirmedEmail) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-5xl">📧</div>
        <h3 className="font-bold text-gray-900">¡Revisa tu email!</h3>
        <p className="text-sm text-gray-500">
          Te enviamos un enlace de confirmación a{' '}
          <span className="font-medium text-gray-700">{email}</span>.
          Confírmalo para activar tu cuenta.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Ir al login →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nombre completo
        </label>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Juan García"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Username
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            @
          </span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={e => setUsername(sanitizeUsername(e.target.value))}
            placeholder="juangarcia"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Solo letras minúsculas, números y _</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
          >
            {showPwd ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta gratis'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
