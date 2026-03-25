import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Protection logic
  if (!user && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/restaurant') || (url.pathname.startsWith('/account') && url.pathname !== '/account/login' && url.pathname !== '/account/register'))) {
    url.pathname = '/account/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Role fetching
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = roleData?.role

    if (url.pathname.startsWith('/admin') && role !== 'admin') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (url.pathname.startsWith('/restaurant') && role !== 'owner') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Redirect away from login/register if logged in
    if (url.pathname === '/account/login' || url.pathname === '/account/register') {
      url.pathname = role === 'admin' ? '/admin' : role === 'owner' ? '/restaurant' : '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/restaurant/:path*'],
}
