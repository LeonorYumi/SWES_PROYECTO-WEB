import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PaypalButton from './paypalButton';
import { useState } from 'react';
import { Trash2, ArrowLeft, Plus, Minus } from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [errorPago, setErrorPago] = useState(false);
  const uid = localStorage.getItem('uid');

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-semibold text-gray-900">Tu carrito está vacío</p>
          <p className="text-sm text-gray-500 mt-2">Agrega productos desde el tablero para comenzar tu compra.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Seguir explorando
            </button>
            <Link to="/dashboard" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
              Ir al tablero
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Carrito de compras</h1>
                  <p className="text-sm text-gray-500">{items.length} producto{items.length > 1 ? 's' : ''} seleccionado{items.length > 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={clearCart}
                  className="text-sm font-semibold text-red-500 hover:text-red-600"
                >
                  Vaciar carrito
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-4 border-t border-gray-100 py-4 first:border-t-0 first:pt-0">
                  <div className="h-24 w-full sm:w-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">📦</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">{item.name}</h2>
                        <p className="text-sm text-gray-500">{item.category || 'General'}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-lg p-1 text-gray-600 hover:bg-white"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-lg p-1 text-gray-600 hover:bg-white"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Envío</span>
                <span>Gratis</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {pagoExitoso ? (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <p className="font-semibold">¡Pago realizado con éxito!</p>
                <p className="mt-1">Tu compra quedó registrada y puedes coordinar la entrega con el vendedor.</p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Pagar con PayPal</p>
                <PaypalButton
                  items={items.map(({ id, quantity, price }) => ({ id, quantity, price }))}
                  userId={uid}
                  onSuccess={() => {
                    setPagoExitoso(true);
                    setErrorPago(false);
                    clearCart();
                  }}
                  onError={() => setErrorPago(true)}
                />
                {errorPago && (
                  <p className="mt-2 text-center text-sm text-red-500">No se pudo completar el pago. Intenta nuevamente.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;