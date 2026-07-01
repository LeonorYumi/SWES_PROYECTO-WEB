import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaRobot, FaComments, FaWhatsapp } from 'react-icons/fa';
import { getAll } from '../services/crudService';
import PaypalButton from './paypalButton';

function EmprendimientoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [errorPago, setErrorPago] = useState(false);

  const uid = localStorage.getItem('uid');

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await getAll('products');
        const encontrado = data.find((p) => p.id === id);
        setItem(encontrado || null);
      } catch (error) {
        console.error('Error al cargar el emprendimiento:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando emprendimiento...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm">Emprendimiento no encontrado.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-900 font-semibold text-sm hover:underline"
        >
          Volver al tablero
        </button>
      </div>
    );
  }

  const telefono = item.sellerPhone || item.sellerphone || '';
  const numeroWhatsApp = telefono.replace(/\D/g, '');
  const urlWhatsApp = numeroWhatsApp ? `https://wa.me/${numeroWhatsApp}` : 'https://wa.me/';

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="max-w-[1400px] mx-auto px-5 py-6">

        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-900 transition-colors mb-6"
        >
          <FaArrowLeft className="text-xs" />
          Volver al tablero
        </button>

        {/* Layout de 2 columnas: producto + espacio para chat IA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* COLUMNA PRINCIPAL: info del producto */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6">

            {/* Imagen contenida, no pegada a los bordes */}
            <div className="relative w-full aspect-[16/9] max-h-[380px] rounded-xl overflow-hidden bg-gray-50 mb-6">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl bg-gray-50">
                  🖼️
                </div>
              )}
              <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-white/95 text-blue-950 shadow-sm">
                {item.category || 'General'}
              </span>
            </div>

            {/* Título y precio */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{item.name}</h1>
              <p className="text-gray-900 font-bold text-2xl tracking-tight shrink-0">
                <span className="text-sm font-normal text-gray-500 mr-1">US</span>
                ${item.price}
              </p>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {item.description || 'Sin descripción disponible.'}
            </p>

            {/* Vendedor + botón de WhatsApp junto al nombre */}
            <div className="flex items-center justify-between gap-3 py-5 border-y border-gray-100 mb-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-11 w-11 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center uppercase shrink-0">
                  {(item.sellerName || item.sellername || 'V').substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {item.sellerName || item.sellername || 'Anónimo'}
                    </p>
                    <a
                      href={urlWhatsApp}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Contactar por WhatsApp a ${item.sellerName || item.sellername || 'el vendedor'}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-900 hover:bg-blue-950 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      <FaWhatsapp className="text-[11px]" />
                      Contactar por WhatsApp
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 font-medium truncate">
                    Tel: {telefono || 'No asignado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bloque de pago con PayPal */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              {pagoExitoso ? (
                <div className="text-center py-4">
                  <p className="text-green-600 font-semibold text-sm mb-1">
                    ¡Pago realizado con éxito! ✅
                  </p>
                  <p className="text-xs text-gray-500">
                    Ya podés coordinar la entrega con el vendedor por WhatsApp.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Pagar con PayPal
                  </p>
                  <PaypalButton
                    items={[
                      {
                        id: item.id,
                        quantity: 1,
                        price: item.price,
                      },
                    ]}
                    userId={uid}
                    onSuccess={(details) => {
                      console.log('Pago completado:', details);
                      setPagoExitoso(true);
                      setErrorPago(false);
                    }}
                    onError={() => {
                      setErrorPago(true);
                    }}
                  />
                  {errorPago && (
                    <p className="text-red-500 text-xs mt-2 text-center">
                      Hubo un problema con el pago, intentá de nuevo.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* COLUMNA LATERAL: placeholder del chat IA en vivo */}
          <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[420px] lg:min-h-[560px] lg:sticky lg:top-6">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <div className="h-9 w-9 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0">
                <FaRobot className="text-sm" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Asistente IA</p>
                <p className="text-[11px] text-gray-400">Próximamente en vivo</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <FaComments className="text-blue-900 text-lg" />
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
                Aquí se mostrará el chat en vivo con IA sobre este emprendimiento.
              </p>
              <p className="text-[10px] text-gray-300 font-medium uppercase tracking-wide">
                Conexión websocket pendiente
              </p>
            </div>

            <div className="p-4 border-t border-gray-100">
              <input
                disabled
                placeholder="Escribe tu pregunta..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EmprendimientoDetalle;
