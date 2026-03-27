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

    let menuItems: any[] = []
    
    if (restaurantIds.length > 0) {
      const { data, error } = await auth.supabase!
        .from('menu_items')
        .select('*')
        .in('restaurant_id', restaurantIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      menuItems = data || []
    }

    return NextResponse.json({ menuItems })
  } catch (err: unknown) {
    console.error("Raw Database Error in GET /api/owner/menu-items:", err)
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in GET /api/owner/menu-items:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, price, description, image_url, category_id, restaurant_id } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!price) return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    if (!category_id) return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: menuItem, error } = await auth.supabase!
      .from('menu_items')
      .insert({
        name,
        price,
        description,
        image_url,
        category_id,
        restaurant_id
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ menuItem })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
