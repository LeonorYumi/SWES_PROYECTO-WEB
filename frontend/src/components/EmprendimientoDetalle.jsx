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
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] gap-8 items-start">

          
          {/* COLUMNA PRINCIPAL */}
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            
            <div className="grid lg:grid-cols-2 gap-10">
              
              {/* GALERÍA  */}
              
              <div>
                <div className="rounded-2xl overflow-visible p-4">
                  <ProductGalleryCarousel
                  productId={item.id}
                  fallbackImage={item.image || ''}
                  />
                </div>
                
            </div>
            
            {/* INFORMACIÓN */}
            
            <div className="flex flex-col">
              
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-900 mb-4">
                {item.category || "General"}
              </span>
              
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-[20px] font-medium text-gray-900 flex-1">
                  {item.name}
                </h1>
                <div className="text-right">
                  
                  <h2 className="text-[20px] font-medium text-blue-900">
                    ${item.price}
                  </h2>
                </div>
              </div>
              
              <div className="border rounded-xl p-5 mb-6 text-sm">
                <h3 className="font-semibold text-gray-800 mb-2">
                    Descripción
                </h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                    {item.description || "Sin descripción disponible."}
                </p>
              </div>

            {/* VENDEDOR */}

            <div className="border rounded-xl p-5 mb-6">

                <h3 className="font-semibold mb-4 text-sm">
                    Información del vendedor
                </h3>

                <div className="flex items-center gap-4">

                    <div className="w-14 h-14 rounded-full bg-slate-100 border flex items-center justify-center font-medium text-sm">

                        {(item.sellerName || item.sellername || "V").substring(0,2)}

                    </div>

                    <div className="flex-1">

                        <p className="font-medium text-sm">

                            {item.sellerName || item.sellername || "Anónimo"}

                        </p>

                        <p className="text-[12px] text-gray-500">

                            {telefono || "No asignado"}

                        </p>

                    </div>

                </div>

                <a
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 w-full flex justify-center items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-sm font-semibold transition"
                >
                    <FaWhatsapp />
                    Contactar por WhatsApp
                </a>
            </div>

            {/* BOTONES */}

            <div className="grid grid-cols-2 gap-3">

                <button
                    onClick={() => addItem(item)}
                    className="rounded-xl border-2 border-blue-900 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                >
                    Agregar al carrito
                </button>

                <button
                    onClick={() => navigate("/carrito")}
                    className="rounded-xl bg-blue-900 py-2.5 text-sm font-semibold text-white hover:bg-blue-950 transition-colors"
                >
                    Ver carrito
                </button>

            </div>

        </div>

    </div>

</div>

          {/* COLUMNA LATERAL: chat en vivo con el emprendedor */}
          <div className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden sticky top-6 h-[calc(100vh-8rem)] max-h-[600px]">
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
