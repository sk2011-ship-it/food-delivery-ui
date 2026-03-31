import { checkAdmin } from '@/lib/auth-helpers';
import { adminClient } from '@/lib/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const auth = await checkAdmin();
  if (auth.error) {
    console.error('Revenue API Auth Error:', auth.error);
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    console.log('Fetching orders with payment_status = paid...');
    const { data: orders, error } = await adminClient
      .from('orders')
      .select('total_amount, restaurant_id, payment_status')
      .eq('payment_status', 'paid');

    if (error) {
      console.error('Database Error fetching revenue:', error);
      throw error;
    }

    console.log(`Successfully fetched ${orders?.length || 0} paid orders.`);
    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    console.error('Fetch revenue error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
