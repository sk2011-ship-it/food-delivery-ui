import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkOwner()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { data: ownerRestaurants } = await auth.supabase!
      .from('restaurants')
      .select('id')
      .eq('owner_id', auth.user!.id)

    const restaurantIds = ownerRestaurants?.map(r => r.id) || []

    let categories: any[] = []

    if (restaurantIds.length > 0) {
      const { data, error } = await auth.supabase!
        .from('categories')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      categories = data || []
    }

    return NextResponse.json({ categories })
  } catch (err: unknown) {
    console.error("Raw Database Error in GET /api/owner/categories:", err)
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in GET /api/owner/categories:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, restaurant_id } = await request.json()

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

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
