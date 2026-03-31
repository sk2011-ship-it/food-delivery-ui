import { createClient } from '@/lib/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: Request) {
  const supabase = await createClient();
  
  // 1. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { items, totalPrice } = await request.json();

    // 2. Validate Cart
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const hasUnavailable = items.some((item: any) => item.is_available === false);
    if (hasUnavailable) {
      return NextResponse.json({ error: 'Some items are no longer available' }, { status: 400 });
    }

    const restaurantId = items[0].restaurant_id;
    if (!restaurantId) {
      return NextResponse.json({ error: 'Invalid restaurant data' }, { status: 400 });
    }

    // 3. Create Order in Database
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const service_charge = 2.00; // Fixed delivery fee
    const vat_amount = parseFloat((subtotal * 0.05).toFixed(2)); // 5% VAT
    const grand_total = parseFloat((subtotal + service_charge + vat_amount).toFixed(2));

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        total_amount: grand_total,
        vat_amount: vat_amount,
        service_charge: service_charge,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Create Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 5. Create Stripe Session
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add Service Charge
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Service Charge',
        },
        unit_amount: Math.round(service_charge * 100),
      },
      quantity: 1,
    });

    // Add VAT
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'VAT (5%)',
        },
        unit_amount: Math.round(vat_amount * 100),
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?order_id=${order.id}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
      customer_email: user.email,
      metadata: {
        order_id: order.id,
      },
    });

    // 6. Update order with Stripe session ID (optional but good)
    await supabase
      .from('orders')
      .update({ payment_intent_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
