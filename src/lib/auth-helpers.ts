import { createClient } from './server'

export async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { user: null, role: null, error: 'Unauthorized', status: 401 }

    let { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!roleData && !roleError) {
        // Fallback to old 'id' column
        const fallback = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        roleData = fallback.data
    }

    if (roleData?.role !== 'admin') {
        return { user, role: roleData?.role, error: 'Forbidden: Admin access required', status: 403 }
    }

    return { user, role: 'admin', supabase }
}

export async function checkOwner(restaurantId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { user: null, role: null, error: 'Unauthorized', status: 401 }

    let { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!roleData && !roleError) {
        // Fallback to old 'id' column
        const fallback = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
        roleData = fallback.data
    }

    if (roleData?.role !== 'owner' && roleData?.role !== 'admin') {
        return { user, role: roleData?.role, error: 'Forbidden: Owner access required', status: 403 }
    }

    // If restaurantId is provided, check ownership
    if (restaurantId && roleData.role === 'owner') {
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('owner_id')
            .eq('id', restaurantId)
            .single()

        if (restaurant?.owner_id !== user.id) {
            return { user, role: 'owner', error: 'Forbidden: You do not own this restaurant', status: 403 }
        }
    }

    return { user, role: roleData.role, supabase }
}
