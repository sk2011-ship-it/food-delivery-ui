import { checkAdmin } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await checkAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    // 1. Get all user IDs with 'owner' role
    const { data: ownersRoles, error: rError } = await auth.supabase!
      .from('user_roles')
      .select('id, user_id, role')
      .eq('role', 'owner')

    if (rError) throw rError

    console.log("Found owner roles:", JSON.stringify(ownersRoles, null, 2))

    if (!ownersRoles || ownersRoles.length === 0) {
      return NextResponse.json({ owners: [] })
    }

    // Map to list of candidate IDs (some might be in id, some in user_id)
    const ownerIds = ownersRoles.map(r => r.user_id || r.id)
    const uniqueOwnerIds = Array.from(new Set(ownerIds.filter(Boolean)))

    console.log("Candidate owner IDs:", uniqueOwnerIds)

    // 2. Get user details from user_details
    const { data: details, error: dError } = await auth.supabase!
      .from('user_details')
      .select('id, first_name, last_name, mobile, postcode')
      .in('id', uniqueOwnerIds)

    if (dError) throw dError

    console.log("Found user details:", JSON.stringify(details, null, 2))

    // Fallback if details are not found for some owners
    // (though they should have details if registered via signup)
    return NextResponse.json({ owners: details || [] })
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : "An unexpected error occurred"
    console.error("API Error in /api/admin/owners:", error)
    return NextResponse.json({ error }, { status: 500 })
  }
}
