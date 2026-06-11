import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and getUser.
  // Refresh the session — required for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPath = path === '/login' || path === '/register'
  const isStaticPath =
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)

  if (isStaticPath) return supabaseResponse

  // Unauthenticated user trying to access protected route
  if (!user && !isAuthPath && path !== '/') {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectTo', path)
    return NextResponse.redirect(url)
  }

  // Authenticated user trying to access auth pages
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL('/map', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
