import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaWhatsapp, FaShoppingCart } from 'react-icons/fa';
import SidebarFilters from './SidebarFilters';
import { getAll } from '../services/crudService';
import { useCart } from '../context/CartContext';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const { addItem } = useCart();

  const role = localStorage.getItem('role') || 'visitante';
  const uid = localStorage.getItem('uid');
  const userName = localStorage.getItem('name') || 'Visitante';

  useEffect(() => {
    const cargarProductos = async () => {
      setLoading(true);
      try {
        // Todos ven TODOS los productos en el tablero
        const data = await getAll('products');
        setItems(data || []);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarProductos();
  }, []);

  const productosFiltrados = items.filter((it) => {
    const busquedaLower = busqueda.toLowerCase();
    const coincideCat = categoriaActiva === 'todas' || it.category?.toLowerCase() === categoriaActiva.toLowerCase();
    const coincideBusq = it.name?.toLowerCase().includes(busquedaLower) || it.description?.toLowerCase().includes(busquedaLower);
    return coincideCat && coincideBusq;
  });

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      <div className="max-w-[1400px] mx-auto px-5 py-6">
        {/* CONTENEDOR DE FILTROS Y BÚSQUEDA INTEGRADOS */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
            
            <div className="relative w-full sm:max-w-xl">
              <FaSearch className="absolute left-4 top-3.5 text-gray-400 text-sm" />
              <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar emprendimientos..."
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none transition-all focus:bg-white focus:border-blue-900 focus:ring-4 focus:ring-blue-900/5"
              />
            </div>
            
            {/* Botón Publicar: Más estilizado */}
            
            {(role === 'emprendedor' || role === 'administrador') && (
              <button 
              onClick={() => navigate('/admin/products/new')} 
              className="w-full sm:w-auto bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-xs transition-all duration-200 shrink-0 whitespace-nowrap"
              >
                Publicar Emprendimiento
              </button>
            )}
          </div>

          {/* Filtros en Línea Horizontal */}
          <div className="w-full overflow-x-auto pb-2 flex gap-2 scrollbar-none snap-x">
            <SidebarFilters categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} />
          </div>
        
        </div>

          {/* SECCIÓN DE PRODUCTOS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {loading ? (
            <p className="text-center col-span-full text-gray-500">Cargando emprendimientos...</p>
          ) : productosFiltrados.length === 0 ? (
            <p className="text-center col-span-full text-gray-500">No hay emprendimientos disponibles</p>
          ) : (
            productosFiltrados.map((it) => (
              <div 
                key={it.id} 
                className="bg-white border border-gray-150/80 rounded-2xl p-4 shadow-3xs flex flex-col h-full group hover:-translate-y-1 hover:shadow-md transition-all duration-300"
              >
                {it.category && (
                  <span className="inline-block mb-1.5 text-xs font-bold uppercase tracking-wide text-blue-900/70">
                    {it.category}
                  </span>
                )}

                {/* Contenedor de la Imagen */}
                
                <div className="relative aspect-video w-full mb-4 overflow-hidden rounded-xl bg-gray-50 border border-gray-100/50 flex items-center justify-center">
                {it.image ? (
                  <img 
                  src={it.image} 
                  alt={it.name} 
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl bg-gray-50">🖼️</div>
                )}
                </div>

                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h2 className="text-xl font-medium text-gray-900 group-hover:text-blue-900 transition-colors line-clamp-1 min-w-0">
                    {it.name}
                  </h2>
                  
                  <p className="shrink-0 text-black font-sans text-xl tracking-tight leading-none">
                    <span className="text-sm font-bold">$</span>
                    {Number(it.price).toFixed(2)}
                  </p>

                </div>

                {/* Descripción Corta */}
                <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed mb-4 font-sans">
                  {it.description || 'Sin descripción disponible.'}
                </p>

                {/* Acciones */}
                <div className="mb-4 flex items-center gap-2">
                  <button
                  type="button"
                  onClick={() => navigate(`/emprendimientos/${it.id}`)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-900 hover:bg-blue-950 text-white px-4 py-2.5 text-xs font-semibold transition-colors duration-200 shadow-sm whitespace-nowrap"
                  >
                    Ver más información
                  </button>
                  
                  <button
                  type="button"
                  onClick={() => addItem(it)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-900 text-blue-900 px-4 py-2.5 text-xs font-semibold transition-colors duration-200 hover:bg-blue-900 hover:text-white whitespace-nowrap"
                  >
                    <FaShoppingCart size={12} />
                    Agregar al carrito
                  </button>
                </div>
                

                {/* Contenedor Inferior Dinámico (Empujado al fondo) */}

                <div className="mt-auto">
                  <div className="pt-4 border-t border-gray-100 mb-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
                      {(it.sellerName || it.sellername || 'V').substring(0, 2)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {it.sellerName || it.sellername || 'Anónimo'}
                      </p>
                      
                      <p className="text-xs text-gray-400 font-medium truncate">
                        Tel: {it.sellerPhone || it.sellerphone || 'No asignado'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </section>

        </div>
      </div>
  );
}

export default Dashboard;