import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { RestaurantLocation } from '@/types/restaurant'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { data: restaurants, error } = await auth.supabase!
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ restaurants })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    console.log("POST Restaurant Body:", JSON.stringify(body, null, 2))
    const { name, location, phone, email, owner_id } = body

    // Validation
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    
    // Location Validation (Newcastle, Downpatrick, Kilkeel)
    const validLocations: RestaurantLocation[] = ["Newcastle", "Downpatrick", "Kilkeel"]
    if (!validLocations.includes(location as RestaurantLocation)) {
      return NextResponse.json({ error: `Invalid location. Must be one of: ${validLocations.join(', ')}` }, { status: 400 })
    }

    const { data: restaurant, error } = await auth.supabase!
      .from('restaurants')
      .insert({
        name,
        location,
        phone,
        email,
        owner_id: owner_id || null
      })
      .select()
      .single()

    if (error) {
      console.error("Database Error creating restaurant:", error)
      throw error
    }
    return NextResponse.json({ restaurant })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in POST /api/admin/restaurants:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    // 1. Delete dependent menu items
    await auth.supabase!
      .from('menu_items')
      .delete()
      .eq('restaurant_id', id)

    // 2. Delete dependent categories
    await auth.supabase!
      .from('categories')
      .delete()
      .eq('restaurant_id', id)

    // 3. Delete the restaurant
    const { error } = await auth.supabase!
      .from('restaurants')
      .delete()
      .eq('id', id)

    if (error) {
        console.error('Delete error for ID:', id, error)
        throw error
    }
    return NextResponse.json({ message: 'Restaurant and all its data deleted successfully' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error('DELETE restaurant 500 error:', error)
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const body = await request.json()
    console.log("PATCH Restaurant Body:", JSON.stringify(body, null, 2))
    const { name, location, phone, email, owner_id } = body

    // Validation
    if (location) {
      const validLocations: RestaurantLocation[] = ["Newcastle", "Downpatrick", "Kilkeel"]
      if (!validLocations.includes(location as RestaurantLocation)) {
        return NextResponse.json({ error: `Invalid location. Must be one of: ${validLocations.join(', ')}` }, { status: 400 })
      }
    }

    const { data: restaurant, error } = await auth.supabase!
      .from('restaurants')
      .update({
        name,
        location,
        phone,
        email,
        owner_id: owner_id === undefined ? undefined : (owner_id || null)
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("Database Error updating restaurant:", error)
      throw error
    }
    return NextResponse.json({ restaurant })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in PATCH /api/admin/restaurants:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}
