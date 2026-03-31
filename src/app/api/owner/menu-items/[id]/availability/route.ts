import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: PageProps) {
  const { id } = await params
  
  try {
    const body = await request.json()
    const { restaurant_id, is_available } = body

    if (!restaurant_id) return NextResponse.json({ error: 'restaurant_id is required' }, { status: 400 })

    // Perform ownership check
    const auth = await checkOwner(restaurant_id)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    // If is_available is provided in body, use it. Otherwise toggle (though my api.ts passes it)
    const { data: menuItem, error } = await auth.supabase!
      .from('menu_items')
      .update({ is_available })
      .eq('id', id)
      .eq('restaurant_id', restaurant_id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ menuItem })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in PATCH /api/owner/menu-items/[id]/availability:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}
