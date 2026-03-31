import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ user: null, role: null, details: null })
    }

    // Try 'user_id' first, then fallback to 'id'
    let { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!roleData) {
        const { data: fallback } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        roleData = fallback
    }

    const { data: detailsData } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    return NextResponse.json({
        user,
        role: roleData?.role || null,
        details: detailsData || null
    })
}

export async function PATCH(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { first_name, last_name, mobile, postcode } = await request.json()

    const { data, error } = await supabase
        .from('user_details')
        .upsert({
            id: user.id,
            first_name,
            last_name,
            mobile,
            postcode,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, details: data })
}

export async function PUT(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password: newPassword, currentPassword } = await request.json()

    if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }

    // 1. Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
    })

    if (verifyError) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 401 })
    }

    // 2. Update password
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
}