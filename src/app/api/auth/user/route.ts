import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ user: null, role: null, details: null })
    }

    const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('id', user.id)
        .single()

    const { data: detailsData } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', user.id)
        .single()

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

    return NextResponse.json({ details: data })
}
