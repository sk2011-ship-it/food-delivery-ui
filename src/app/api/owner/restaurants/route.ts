import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkOwner()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    console.log("Fetching owner restaurants for user ID:", auth.user!.id)
    const { data: restaurants, error } = await auth.supabase!
      .from('restaurants')
      .select('*')
      .eq('owner_id', auth.user!.id)
      .order('created_at', { ascending: false })

    console.log("Fetched restaurants:", restaurants)
    if (error) throw error
    return NextResponse.json({ restaurants })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
