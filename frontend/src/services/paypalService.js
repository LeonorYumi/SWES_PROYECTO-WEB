const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000/api';

export const createPaypalOrder = async (items, userId) => {
  const res = await fetch(`${API_URL}/paypal/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, userId }),
  });

  if (!res.ok) throw new Error('Error creando la orden de PayPal');

  const data = await res.json();
  return data.id;
};

export const capturePaypalOrder = async (orderID) => {
  const res = await fetch(`${API_URL}/paypal/capture-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderID }),
  });

  if (!res.ok) throw new Error('Error capturando el pago');

  return res.json();
};