import { useEffect, useState } from 'react';
import {
  getAll,
  getByUserId,
  deleteResource
} from '../services/crudService';

import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, texto: '', tipo: '' });
  const [modalEliminar, setModalEliminar] = useState({ abierto: false, productoId: null });
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 4;

  const navigate = useNavigate();
  const location = useLocation();
  const role = (localStorage.getItem('role') || 'visitante').toLowerCase();
  const miUid = localStorage.getItem('uid') || '';
  const token = localStorage.getItem('token') || '';

  const mostrarToast = (texto, tipo = 'success') => {
    setToast({ mostrar: true, texto, tipo });
    setTimeout(() => {
      setToast({ mostrar: false, texto: '', tipo: '' });
    }, 3000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        throw new Error('No hay token. Por favor inicia sesión.');
      }

      if (!miUid) {
        throw new Error('No hay UID. Por favor inicia sesión nuevamente.');
      }

      let data = [];

      if (role === 'administrador') {
        data = await getAll('products');
      } else if (role === 'emprendedor') {
        data = await getByUserId('products', miUid);
      } else {
        throw new Error(`Rol no permitido: ${role}`);
      }

      setProducts(data || []);
      setPaginaActual(1);

    } catch (err) {
      console.error('Error al cargar productos:', err);
      let mensaje = err.message || 'Error desconocido';
      if (err.response?.status === 401) {
        mensaje = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (err.response?.status === 403) {
        mensaje = 'No tienes permisos para ver estos productos.';
      }
      setError(mensaje);
      mostrarToast(mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === '/admin/products') {
      load();
    }
  }, [location.pathname]);

  const confirmarEliminar = (id) => {
    setModalEliminar({ abierto: true, productoId: id });
  };

  const handleExecuteDelete = async () => {
    const id = modalEliminar.productoId;
    setModalEliminar({ abierto: false, productoId: null });

    try {
      await deleteResource('products', id);
      mostrarToast('Producto eliminado correctamente', 'success');
      await load();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo eliminar el producto', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* TOAST */}
      {toast.mostrar && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border transition-all duration-300 ${
            toast.tipo === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}
        >
          <p className="text-sm font-semibold">{toast.texto}</p>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {modalEliminar.abierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col gap-4">
            <h3 className="text-lg font-bold text-gray-800">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600">¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar({ abierto: false, productoId: null })}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-5 py-8">
        {/* HEADER */}
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 mb-8 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-xl font-bold text-gray-950 tracking-tight uppercase">
      {role === 'administrador' ? 'Emprendimientos SWES' : 'Mis Emprendimientos'}
    </h1>
    
    <p className="text-xs text-gray-500 mt-1">
      {role === 'administrador' 
      ? 'Panel de control global: Gestiona todos los productos registrados en el sistema' 
      : 'Modifica, gestiona y mantén actualizados tus propios emprendimientos'}
    </p>
  </div>

  {role !== 'visitante' && (
    <button
      onClick={() => navigate('/admin/products/new')}
      className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xs transition-all duration-200 shrink-0"
    >
      Publicar Emprendimiento
    </button>
  )}
</div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-3xs">
            <p className="text-gray-500 text-sm font-medium">Cargando emprendimientos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto">
            <p className="text-red-700 font-bold text-base mb-2">Error al cargar datos</p>
            <p className="text-xs text-red-600 mb-5">{error}</p>
            <button
              onClick={() => {
                setError(null);
                load();
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center shadow-3xs max-w-2xl mx-auto">
            <p className="text-gray-800 font-bold text-base">No tienes productos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Crea tu primer emprendimiento para empezar a promocionarte en la comunidad.</p>
            {role !== 'visitante' && (
              <button
                onClick={() => navigate('/admin/products/new')}
                className="mt-5 bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-xs transition-all"
              >
                Crear Primer Emprendimiento
              </button>
            )}
          </div>
        ) : (
          <>
            {/* PRODUCTOS CON PAGINACIÓN */}
            {(() => {
              const totalPaginas = Math.ceil(products.length / ITEMS_POR_PAGINA);
              const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
              const indiceFin = indiceInicio + ITEMS_POR_PAGINA;
              const productosEnPagina = products.slice(indiceInicio, indiceFin);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full mb-8">
                    {productosEnPagina.map((p) => (
              <div 
                key={p.id} 
                className="bg-white border border-gray-100/60 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] flex flex-col h-full group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300"
              >
                {/* IMAGEN: Renderizado completo y fluido */}
                <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-2xl bg-gray-50/50 flex items-center justify-center border border-gray-100">
                  {p.image ? (
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🖼️</div>
                  )}

                  {p.category && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/90 text-blue-950 shadow-3xs backdrop-blur-xs">
                      {p.category}
                    </span>
                  )}
                </div>
                
                {/* CONTENIDO PRINCIPAL */}
                <h2 className="text-lg font-bold text-gray-950 group-hover:text-blue-900 transition-colors line-clamp-1 tracking-tight">
                  {p.name}
                </h2>
                
                <p className="text-xs text-gray-500 mt-1 mb-3.5 line-clamp-2 leading-relaxed font-medium">
                  {p.description || 'Sin descripción disponible.'}
                </p>
                
                {/* PRECIO ADAPTADO EXACTAMENTE AL ESTILO REQUERIDO */}
                <p className="text-gray-900 font-semibold text-[17px] tracking-tight mb-4">
                  <span className="text-xs font-normal text-gray-500 mr-0.5">US</span>${p.price}
                </p>

                {/* FOOTER DINÁMICO */}
                <div className="mt-auto">
                  {/* INFO DEL VENDEDOR: Diseño Avatar Minimalista */}
                  <div className="pt-3 border-t border-gray-100 mb-4 flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 font-bold text-[11px] flex items-center justify-center uppercase shrink-0">
                      {(p.sellerName || p.sellername || 'V').substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {p.sellerName || p.sellername || 'No disponible'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">
                        {p.sellerPhone || p.sellerphone || 'Sin teléfono'}
                      </p>
                    </div>
                  </div>

                  {/* ACCIONES DE EDICIÓN Y ELIMINACIÓN */}
                  <div className="flex gap-2.5">
                    <Link
                      to={`/admin/products/edit/${p.id}`}
                      className="flex-1 text-center bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 py-2 rounded-xl text-xs font-bold transition-colors duration-150"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => confirmarEliminar(p.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100/80 border border-red-100 text-red-600 py-2 rounded-xl text-xs font-bold transition-colors duration-150"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
                    ))}
                  </div>

                  {/* CONTROLES DE PAGINACIÓN */}
                  {totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                        disabled={paginaActual === 1}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Anterior
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                          <button
                            key={pagina}
                            onClick={() => setPaginaActual(pagina)}
                            className={`w-10 h-10 rounded-lg font-semibold text-sm transition ${
                              paginaActual === pagina
                                ? 'bg-blue-900 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pagina}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}

                  <div className="text-center text-xs text-gray-500 mt-4">
                    Mostrando {indiceInicio + 1} - {Math.min(indiceFin, products.length)} de {products.length} productos
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;