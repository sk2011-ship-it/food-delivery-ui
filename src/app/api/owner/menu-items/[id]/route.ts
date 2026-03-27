import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: PageProps) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { name, price, description, image_url, category_id, restaurant_id, is_available } = body

    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { data: menuItem, error } = await auth.supabase!
      .from('menu_items')
      .update({
        name,
        price,
        description,
        image_url,
        category_id,
        is_available
      })
      .eq('id', id)
      .eq('restaurant_id', restaurant_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ menuItem })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in PATCH /api/owner/menu-items/[id]:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: PageProps) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')

  if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

  const auth = await checkOwner(restaurant_id)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { error } = await auth.supabase!
      .from('menu_items')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', restaurant_id)

    if (error) throw error
    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in DELETE /api/owner/menu-items/[id]:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}
