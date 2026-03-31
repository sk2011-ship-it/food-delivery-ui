import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { data: menuItems, error } = await auth.supabase!
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ menuItems })
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
    const { name, price, description, image_url, category_id, restaurant_id } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!price) return NextResponse.json({ error: 'Price is required' }, { status: 400 })
    if (!category_id) return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

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

export async function DELETE(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await auth.supabase!
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
