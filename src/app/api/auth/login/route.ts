import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { email, password } = await request.json()
    const supabase = await createClient()

    // 1. Sign in user
    const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: authError.status || 400 })
    }

    if (!data.user) {
        return NextResponse.json({ error: 'Login failed' }, { status: 400 })
    }

    // 2. Fetch role
    const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', data.user.id)
        .single()

    if (roleError || !roleData) {
        // If role not found, logout immediately
        await supabase.auth.signOut()
        return NextResponse.json({ error: 'Account not set up properly' }, { status: 403 })
    }

    return NextResponse.json({ user: data.user, role: roleData.role })
}
