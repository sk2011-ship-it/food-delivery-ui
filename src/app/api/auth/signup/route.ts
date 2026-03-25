import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, confirmPassword, role, first_name, last_name, mobile, postcode } = await request.json()

  // 1. Validate
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  if (role === 'admin') {
    return NextResponse.json({ error: 'Admin registration is not allowed' }, { status: 403 })
  }

  if (role !== 'customer' && role !== 'owner') {
    return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
  }

  const supabase = await createClient()

  // 2. Create user (Sign up)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 400 })
  }

  const userId = authData.user.id

  // 3. Insert into user_roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      id: userId,
      role: role,
    })

  if (roleError) {
    console.error('Role insertion failed:', roleError)
    return NextResponse.json({ error: 'Account created but role assignment failed.' }, { status: 500 })
  }

  // 4. Insert into user_details
  const { error: detailsError } = await supabase
    .from('user_details')
    .insert({
      id: userId,
      first_name,
      last_name,
      mobile,
      postcode,
    })

  if (detailsError) {
    console.error('Details insertion failed:', detailsError)
    return NextResponse.json({ error: 'Account created but profile details failed to save.' }, { status: 500 })
  }

  // dont want auto login after signup so sign out
  await supabase.auth.signOut()

  return NextResponse.json({ user: authData.user })
}
