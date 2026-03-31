import { checkOwner } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: PageProps) {
  const { id } = await params
  const auth = await checkOwner(id)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const { name, location, phone, email, opening_time, closing_time } = body

    const { data: restaurant, error } = await auth.supabase!
      .from('restaurants')
      .update({
        name,
        location,
        phone,
        email,
        opening_time,
        closing_time
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ restaurant })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    return NextResponse.json({ error }, { status: 500 })
  }
}
