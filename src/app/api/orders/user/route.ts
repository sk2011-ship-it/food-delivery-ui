import { createClient } from '@/lib/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch orders with restaurant names and items
    // Using a nested select for items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurants (
          name
        ),
        order_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders });
  } catch (err: any) {
    console.error('Fetch orders error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
