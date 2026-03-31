import { checkAdmin } from '@/lib/auth-helpers'
import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const supabase = auth.supabase!

    // 1. Get all roles
    const { data: roles, error: rError } = await supabase
      .from('user_roles')
      .select('id, user_id, role')

    if (rError) throw rError

    // 2. Get all user details
    const { data: details, error: dError } = await supabase
      .from('user_details')
      .select('*')

    if (dError) throw dError

    // 3. Get Auth Emails (This requires Service Role or specialized setup, 
    // but we can join with what we have if the table exists or just return details)
    // For now we rely on user_details having email if stored there, or just the ID/Name.
    // Usually auth.users is not accessible via standard client.

    const users = details.map(d => ({
      ...d,
      role: roles.find(r => r.user_id === d.id || r.id === d.id)?.role || 'customer'
    }))

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to fetch users"
    return NextResponse.json({ error }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const { id, role, ...details } = body

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 })

    const supabase = auth.supabase!

    // 1. Update Role if provided
    if (role) {
      // Upsert using both fields for maximum compatibility
      const { error: rError } = await supabase
        .from('user_roles')
        .upsert({ id, user_id: id, role })

      if (rError) throw rError
    }

    // 2. Update Details if provided
    if (Object.keys(details).length > 0) {
      const { error: dError } = await supabase
        .from('user_details')
        .update(details)
        .eq('id', id)

      if (dError) throw dError
    }

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "Failed to update user"
    return NextResponse.json({ error }, { status: 500 })
  }
}
