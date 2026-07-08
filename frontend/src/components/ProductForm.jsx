import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProductImages, createResource, getById, updateResource } from '../services/crudService';
import ProductImagesUploader from './ProductImagesUploader';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', image: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [sessionExpiredModal, setSessionExpiredModal] = useState({ visible: false, message: '' });

  const handleSessionExpired = (message = 'Sesión expirada. Por favor inicia sesión de nuevo.') => {
    localStorage.removeItem('token');
    localStorage.removeItem('uid');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    setSessionExpiredModal({ visible: true, message });
  };

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        const item = await getById('products', id);
        setForm({
          name: item.name || item.title || '',
          description: item.description || '',
          price: item.price || '',
          category: item.category || '',
          image: item.image || item.imagen || '',
        });
      } catch (err) {
        console.error(err);
        if (err?.response?.status === 401) {
          handleSessionExpired('Sesión expirada. Por favor inicia sesión nuevamente.');
        } else {
          setFormError('No se pudo cargar el producto. Intenta nuevamente.');
        }
      }
    };

    loadProduct();
  }, [id]);

  const validateField = (name, value) => {
    let errorMsg = '';
    if (name === 'name' && !value.trim()) {
      errorMsg = 'El nombre del producto/servicio es obligatorio.';
    }
    if (name === 'price') {
      if (!value) {
        errorMsg = 'El precio es obligatorio.';
      } else if (isNaN(value) || parseFloat(value) <= 0) {
        errorMsg = 'Ingresa un precio válido y mayor a 0.';
      }
    }
    if (name === 'category' && !value) {
      errorMsg = 'Debes seleccionar una categoría para tu emprendimiento.';
    }

    // Solo actualiza errores si el campo requiere validacion activa
    if (['name', 'price', 'category'].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 1500000) {
      setErrors(prev => ({ ...prev, image: 'La imagen es muy pesada. Máximo 1.5MB o usa un enlace URL.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: reader.result }));
      setErrors(prev => ({ ...prev, image: '' }));
    };
    reader.onerror = (err) => {
      console.error('Error leyendo archivo:', err);
      setErrors(prev => ({ ...prev, image: 'Error al leer la imagen. Intenta con otro archivo.' }));
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUploadComplete = async (uploadedImages) => {
    if (!id || !uploadedImages?.length) return;
    try {
      await createProductImages(id, uploadedImages);
      setUploadMessage('Imágenes guardadas en la galería del producto.');
    } catch (err) {
      console.error('Error al guardar la galería de imágenes:', err);
      setUploadMessage(err?.message || 'No se pudieron guardar las imágenes en la tabla.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const tempErrors = {};
    if (!form.name.trim()) tempErrors.name = 'El nombre es obligatorio.';
    if (!form.price || isNaN(form.price) || parseFloat(form.price) <= 0) tempErrors.price = 'El precio debe ser mayor a 0.';
    if (!form.category) tempErrors.category = 'La categoría es obligatoria.';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleSessionExpired('Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      const sellerName = localStorage.getItem('name') || localStorage.getItem('email') || 'Vendedor';
      const sellerPhone = localStorage.getItem('phone') || '';

      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: form.price,
        image: form.image,
        sellerName,
        sellerPhone,
        sellername: sellerName,
        sellerphone: sellerPhone,
      };

      if (id) {
        await updateResource('products', id, payload);
        navigate('/admin/products', { replace: false });
      } else {
        const created = await createResource('products', payload);
        if (created?.id) {
          navigate(`/admin/products/edit/${created.id}`, { replace: false });
        } else {
          navigate('/admin/products', { replace: false });
        }
      }
    } catch (err) {
      console.error('Error guardando producto:', err);
      if (err.response?.status === 401) {
        handleSessionExpired('Sesión expirada. Por favor inicia sesión nuevamente.');
      } else {
        const errorMessage =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.response?.data?.mensaje ||
          err.message ||
          'Error al guardar el producto';
        setFormError(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 p-10 bg-white rounded-2xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] text-gray-800">
      
      {/* Encabezado Principal */}
      <div className="mb-10 text-center">
        <span className="inline-block px-3 py-1 mb-3 text-[11px] font-bold tracking-wider text-blue-900 uppercase bg-blue-50 rounded-full">
          Vitrina Comunitaria
        </span>
        <h2 className="text-2xl font-bold text-gray-950 tracking-tight sm:text-3xl">
          {id ? 'Editar tu Recurso' : 'Registrar Emprendimiento'}
        </h2>
        <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
          Ingresa los detalles de tu negocio o servicio para actualizar tu espacio en el explorador general.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {formError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {formError}
          </div>
        )}
        
        {/* Sección: Datos Generales Organizados en Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Campo: Nombre */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Nombre del Emprendimiento / Producto</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Ej. Delivery de Almuerzos Poli" 
              className={`w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 transition-all outline-none font-medium focus:bg-white focus:ring-4
                ${errors.name 
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-50' 
                  : 'border-gray-200 focus:border-blue-700 focus:ring-blue-900/10'}`}
            />
            {errors.name && (
              <span className="text-rose-600 text-xs font-semibold mt-1 flex items-center gap-1.5">
                ⚠️ {errors.name}
              </span>
            )}
          </div>

          {/* Campo: Categoría */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Categoría</label>
            <div className="relative">
              <select 
                name="category" 
                value={form.category} 
                onChange={handleChange}
                className={`w-full pl-4 pr-10 py-2.5 border rounded-xl text-sm bg-gray-50/50 transition-all outline-none font-medium appearance-none focus:bg-white focus:ring-4
                  ${errors.category 
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-50' 
                    : 'border-gray-200 focus:border-blue-700 focus:ring-blue-900/10'}`}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
              >
                <option value="">Selecciona una opción</option>
                <option value="Comida">Comida y Snacks</option>
                <option value="Tecnología">Tecnología / Software</option>
                <option value="Ropa">Ropa y Accesorios</option>
                <option value="Servicios">Servicios Académicos / Tutorías</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            {errors.category && (
              <span className="text-rose-600 text-xs font-semibold mt-1 flex items-center gap-1.5">
                ⚠️ {errors.category}
              </span>
            )}
          </div>

          {/* Campo: Precio */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Precio de Venta</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-gray-400 text-sm font-semibold">$</span>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                value={form.price} 
                onChange={handleChange} 
                placeholder="0.00" 
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm bg-gray-50/50 transition-all outline-none font-medium focus:bg-white focus:ring-4
                  ${errors.price 
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-50' 
                    : 'border-gray-200 focus:border-blue-700 focus:ring-blue-900/10'}`}
              />
            </div>
            {errors.price && (
              <span className="text-rose-600 text-xs font-semibold mt-1 flex items-center gap-1.5">
                ⚠️ {errors.price}
              </span>
            )}
          </div>

          {/* Campo: Descripción */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Descripción del Proyecto</label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Cuéntales a tus compañeros de qué trata tu emprendimiento, horarios, puntos de entrega..." 
              rows="3" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 transition-all outline-none font-medium resize-none focus:bg-white focus:border-blue-700 focus:ring-4 focus:ring-blue-900/10"
            />
          </div>

        </div>

        {/* Separador Línea */}
        <div className="h-px bg-gray-100 my-2" />

        {/* Bloque Multimedia: Gestión de Imagen Portada */}
        <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-xl flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">Imagen Ilustrativa</label>
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2 pl-4 shadow-3xs hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs text-gray-400 truncate max-w-[240px] font-medium">
                  {form.image ? "🖼️ Imagen cargada en memoria" : "📁 Subir archivo local"}
                </span>
              </div>
              <label className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0">
                Examinar
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-gray-400 uppercase tracking-wider">O vincula mediante URL externa</label>
            <input 
              name="image" 
              value={form.image} 
              onChange={handleChange} 
              placeholder="https://ejemplo.com/imagen.jpg" 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-900/10 transition-colors font-medium shadow-3xs"
            />
          </div>
          
          {errors.image && (
            <span className="text-rose-600 text-xs font-semibold flex items-center gap-1.5">
              ⚠️ {errors.image}
            </span>
          )}
        </div>

        {id && (
          <div className="p-6 border border-gray-100 bg-white rounded-xl shadow-sm">
            <ProductImagesUploader productId={id} onUploadComplete={handleGalleryUploadComplete} />
            {uploadMessage && (
              <p className="mt-3 text-sm text-blue-900">{uploadMessage}</p>
            )}
          </div>
        )}

        {/* Vista previa Refinada */}
        {form.image && (
          <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white shadow-3xs">
            <img src={form.image} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900">Miniatura del elemento</p>
              <p className="text-[11px] text-gray-400 truncate">Se procesó correctamente y se renderizará de forma responsiva.</p>
            </div>
          </div>
        )}

        {/* Sección de Botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex-1 py-3 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all text-center uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all uppercase tracking-wider disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando cambios...' : 'Publicar Emprendimiento'}
          </button>
        </div>
      </form>
    </div>
  );

}

export default ProductForm;