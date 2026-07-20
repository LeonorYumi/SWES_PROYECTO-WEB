import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createPaypalOrder, capturePaypalOrder } from '../services/paypalService';

export default function PaypalButton({ items, userId, onSuccess, onError }) {
  const initialOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'capture',
  };

  const createOrder = async () => {
    return await createPaypalOrder(items, userId);
  };

  const onApprove = async (data) => {
    const details = await capturePaypalOrder(data.orderID);
    if (onSuccess) onSuccess(details);
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
  <PayPalScriptProvider options={initialOptions}>
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <PayPalButtons
        style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay', height: 45, tagline: false }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          console.error('Error en PayPal:', err);
          if (onError) onError(err);
        }}
      />
    </div>
  </PayPalScriptProvider>
</div>
  );
}