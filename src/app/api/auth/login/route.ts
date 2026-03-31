import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { email, password, remember } = await request.json()
    const supabase = await createClient({ remember })

    // Login
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

    // ✅ Fetch role (user_id primary, id fallback)
    let { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle()

    if (!roleData && !roleError) {
        const fallback = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle()

        roleData = fallback.data
        roleError = fallback.error
    }

    if (roleError || !roleData) {
        console.error('Login role fetching error:', { 
            error: roleError, 
            data: roleData,
            id: data.user.id 
        })

        await supabase.auth.signOut()

        return NextResponse.json({ 
            error: roleError 
                ? `DB Error: ${roleError.message}` 
                : 'Role not found in user_roles. Please ensure your account was created correctly.',
            debug: { userId: data.user.id, code: roleError?.code }
        }, { status: 403 })
    }

    return NextResponse.json({
        user: data.user,
        role: roleData.role
    })
}