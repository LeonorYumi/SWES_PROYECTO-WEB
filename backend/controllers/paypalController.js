const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');
const { client } = require('../utils/paypalClient');
const { supabaseService } = require('../supabase');

async function getOrderAmount(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return total.toFixed(2);
}

const createOrder = async (req, res) => {
  try {
    const { items, userId } = req.body;
    const amount = await getOrderAmount(items);

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        { amount: { currency_code: 'USD', value: amount } },
      ],
    });

    const order = await client().execute(request);

    const { error } = await supabaseService.from('orders').insert({
      user_id: userId || null,
      paypal_order_id: order.result.id,
      status: 'pending',
      amount: amount,
      currency: 'USD',
      items: items,
    });

    if (error) console.error('Error guardando orden en Supabase:', error);

    res.status(200).json({ id: order.result.id });
  } catch (err) {
    console.error('Error creando orden de PayPal:', err);
    res.status(500).json({ error: 'No se pudo crear la orden de PayPal' });
  }
};

const captureOrder = async (req, res) => {
  try {
    const { orderID } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client().execute(request);
    const status = capture.result.status;

    const { error } = await supabaseService
      .from('orders')
      .update({ status: status === 'COMPLETED' ? 'paid' : 'failed' })
      .eq('paypal_order_id', orderID);

    if (error) console.error('Error actualizando orden en Supabase:', error);

    res.status(200).json({ status, details: capture.result });
  } catch (err) {
    console.error('Error capturando orden de PayPal:', err);
    await supabaseService
      .from('orders')
      .update({ status: 'failed' })
      .eq('paypal_order_id', req.body.orderID);
    res.status(500).json({ error: 'No se pudo capturar el pago' });
  }
};

module.exports = { createOrder, captureOrder };