import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(options?: { remember?: boolean }) {
  const cookieStore = await cookies()
  const remember = options?.remember ?? false

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, cookieOptions: CookieOptions) {
          try {
            const finalOptions = remember 
              ? { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 } 
              : cookieOptions
            cookieStore.set({ name, value, ...finalOptions })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, cookieOptions: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...cookieOptions })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
