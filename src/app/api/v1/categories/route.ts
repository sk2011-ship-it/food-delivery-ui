import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')

  try {
    let query = supabase.from('categories').select('*').order('name', { ascending: true })
    if (restaurant_id) query = query.eq('restaurant_id', restaurant_id)

    const { data: categories, error } = await query
    if (error) throw error
    return NextResponse.json({ categories: categories || [] })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
