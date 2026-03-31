import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurantId')

  try {
    let query = supabase.from('menu_items').select('*').order('name', { ascending: true })
    if (restaurantId) query = query.eq('restaurant_id', restaurantId)

    const { data: menuItems, error } = await query
    if (error) throw error
    return NextResponse.json({ menuItems: menuItems || [] })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
