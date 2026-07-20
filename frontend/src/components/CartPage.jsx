import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PaypalButton from './paypalButton';
import { useState } from 'react';
import { Trash2, ArrowLeft, Plus, Minus, Check } from 'lucide-react';

function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [errorPago, setErrorPago] = useState(false);
  const uid = localStorage.getItem('uid');

  const steps = ['Carrito', 'Envío', 'Pago', 'Listo'];
  const currentStep = pagoExitoso ? 3 : 2; // 0-indexed: Carrito y Envío se dan por completados al llegar aquí

  if (!items.length) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <p className="text-lg font-medium text-gray-900">Tu carrito está vacío</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-[#f4f6f8] to-blue-50/40">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* STEPPER */}
        <div className="flex items-center justify-center mb-8 sm:mb-10">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < currentStep
                      ? 'bg-brand-primary text-white'
                      : i === currentStep
                      ? 'bg-brand-primary text-white ring-4 ring-brand-primary/15'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    i <= currentStep ? 'text-brand-primary' : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-10 sm:w-20 h-0.5 mx-2 sm:mx-3 mb-5 transition-colors ${
                    i < currentStep ? 'bg-brand-primary' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="space-y-6">

            {/* ITEMS */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <h1 className="text-lg sm:text-xl font-medium text-brand-primary tracking-tight">
                  Productos del carrito 
                </h1>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-500 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar todo
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="flex flex-row gap-3 sm:gap-4 border-t border-gray-100 py-5 first:border-t-0 first:pt-0 hover:bg-gray-50/50 transition-colors rounded-xl px-2 -mx-2">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
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
                      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1.5 py-1 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-brand-primary transition-colors"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-[15px] font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-brand-primary transition-colors"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
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

            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-medium text-brand-primary tracking-tight mb-4">Resumen del pedido</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Total de productos</span>
                  <span className="font-medium text-gray-800">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Envío</span>
                    <span className="font-medium text-emerald-600">Gratis</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-1">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-xl font-medium text-brand-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                </div>

          </div>

          {/* CHECKOUT / PAGO */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] h-fit sticky top-6">
            <h2 className="text-lg font-medium text-brand-primary tracking-tight mb-5">Finalizar compra</h2>

            {pagoExitoso ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <p className="font-semibold">¡Pago realizado con éxito!</p>
                <p className="mt-1">Tu compra quedó registrada y puedes coordinar la entrega con el vendedor.</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-brand-primary/5 to-brand-accent/10 border border-brand-primary/10 p-4 mb-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-primary/70 mb-3">Total a pagar</p>
                  <p className="text-3xl font-medium text-brand-primary">${totalPrice.toFixed(2)}</p>
                </div>

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

                <p className="mt-5 text-center text-[11px] text-gray-400">
                  Pago seguro procesado por PayPal
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;