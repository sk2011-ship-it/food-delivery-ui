import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      // Fetch single restaurant with its categories and menu items
      const { data: restaurant, error: rError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

      if (rError) throw rError

      const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', id)
        .order('name', { ascending: true })

      if (cError) throw cError

      const { data: menuItems, error: mError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id)
        .order('name', { ascending: true })

      if (mError) throw mError

      return NextResponse.json({ 
        restaurant: {
          ...restaurant,
          categories: categories || [],
          menu_items: menuItems || []
        } 
      })
    } else {
      // Fetch all restaurants
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return NextResponse.json({ restaurants })
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
