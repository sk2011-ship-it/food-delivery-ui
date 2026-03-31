import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { data: categories, error } = await auth.supabase!
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ categories })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { name, restaurant_id } = await request.json()

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    const { data: category, error } = await auth.supabase!
      .from('categories')
      .insert({ name, restaurant_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ category })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
