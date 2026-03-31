import { createClient } from '@/lib/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const {
    email,
    password,
    confirmPassword,
    role,
    first_name,
    last_name,
    mobile,
    postcode
  } = await request.json()

  // Validation
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  if (role === 'admin') {
    return NextResponse.json({ error: 'Admin registration is not allowed' }, { status: 403 })
  }

  if (!['customer', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
  }

  const supabase = await createClient()

  // Create user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name, last_name },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status || 400 })
  }

  if (!authData.user) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 400 })
  }

  const userId = authData.user.id

  // ✅ Insert into user_details FIRST
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
    return NextResponse.json({ error: 'Profile details failed' }, { status: 500 })
  }

  // ✅ Insert into user_roles AFTER
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: role,
    })

  if (roleError) {
    console.error('Role insertion failed:', roleError)
    return NextResponse.json({ error: 'Role assignment failed' }, { status: 500 })
  }

  await supabase.auth.signOut()

  return NextResponse.json({
    message: 'Signup successful',
    user: authData.user,
    role
  })
}