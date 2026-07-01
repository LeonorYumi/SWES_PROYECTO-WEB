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
    <div className="w-full max-w-md mx-auto">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{ layout: 'vertical', color: 'blue', shape: 'rect' }}
          createOrder={createOrder}
          onApprove={onApprove}
          onError={(err) => {
            console.error('Error en PayPal:', err);
            if (onError) onError(err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}