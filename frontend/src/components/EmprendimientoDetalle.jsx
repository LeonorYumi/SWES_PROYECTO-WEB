import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaWhatsapp } from 'react-icons/fa';
import { getById } from '../services/crudService';
import ChatRoom from './ChatRoom';

import { useCart } from '../context/CartContext';

import PaypalButton from './paypalButton';
import ProductGalleryCarousel from './ProductGalleryCarousel';


function EmprendimientoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  // Si venimos con ?chatWith=..., lo pasamos al ChatRoom para abrir el hilo correcto
  const chatWithParam = new URLSearchParams(location.search).get('chatWith') || null;

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const data = await getById('products', id);
        setItem(data || null);
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

        {/* Layout de 2 columnas: producto + espacio para chat */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">

          {/* COLUMNA PRINCIPAL: info del producto */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6">

            {/* Carrusel de galería de imágenes */}
            <ProductGalleryCarousel productId={item.id} fallbackImage={item.image || ''} />
            <span className="mt-4 inline-flex rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-950 shadow-sm">
              {item.category || 'General'}
            </span>

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

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                type="button"
                onClick={() => addItem(item)}
                className="inline-flex items-center justify-center rounded-xl border border-blue-900 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
              >
                Agregar al carrito
              </button>
              <button
                type="button"
                onClick={() => navigate('/carrito')}
                className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-950"
              >
                Ver carrito
              </button>
            </div>

          </div>

          {/* COLUMNA LATERAL: chat en vivo con el emprendedor */}
          <div className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[520px] lg:min-h-[620px] lg:sticky lg:top-6 h-full">
            <ChatRoom
              roomId={item.id}
              sellerName={item.sellerName || item.sellername || 'Emprendedor'}
              ownerId={item.user_id}
              initialThreadId={chatWithParam}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

export default EmprendimientoDetalle;
