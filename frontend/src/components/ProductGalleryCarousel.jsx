import { useEffect, useState } from 'react';
import { getProductImages } from '../services/crudService';

function ProductGalleryCarousel({ productId, fallbackImage }) {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    const loadImages = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProductImages(productId);
        setImages(data || []);
      } catch (err) {
        console.error('Error cargando galería de imágenes:', err);
        setError('No se pudieron cargar las imágenes de la galería. Mostrando imagen principal.');
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, [productId]);

  useEffect(() => {
    setSelected(0);
  }, [productId]);

  const galleryImages = images.map((img, index) => ({
    id: img.id || `${img.image_url || img.url || index}-${index}`,
    image_url: img.image_url || img.url,
  }));

  const allImages = [];
  if (fallbackImage) {
    allImages.push({
      id: 'fallback-image',
      image_url: fallbackImage,
    });
  }
  allImages.push(...galleryImages);

  const seenUrls = new Set();
  const uniqueImages = allImages.filter((img) => {
    const src = img.image_url?.trim();
    if (!src || seenUrls.has(src)) return false;
    seenUrls.add(src);
    return true;
  });

  useEffect(() => {
    if (selected >= uniqueImages.length) {
      setSelected(Math.max(uniqueImages.length - 1, 0));
    }
  }, [uniqueImages.length, selected]);

  const hasImages = uniqueImages.length > 0;
  const currentImage = hasImages ? uniqueImages[selected]?.image_url : null;
  const showFallback = !hasImages && !!fallbackImage;

  const goPrevious = () => {
    if (!hasImages) return;
    setSelected((prev) => (prev <= 0 ? uniqueImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!hasImages) return;
    setSelected((prev) => (prev >= uniqueImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-2">
      <div className="relative h-[320px] w-full rounded-2xl border border-gray-200 bg-white overflow-hidden" >
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">Cargando imágenes...</div>
        ) : currentImage ? (
          <>
            <div className="flex h-full items-center justify-center p-4">
              <img
              src={currentImage}
              alt={`Galería ${selected + 1}`}
              className="max-h-full max-w-full object-contain transition duration-300"
              />
            </div>

            {uniqueImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100"
                  aria-label="Siguiente imagen"
                >
                  ›
                </button>
                <div className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white tracking-wide">
                  {selected + 1} / {uniqueImages.length}
                </div>
              </>
            )}
          </>
        ) : error && !showFallback ? (
          <div className="flex h-full items-center justify-center text-red-500">{error}</div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">No hay imágenes disponibles.</div>
        )}
      </div>

      {error && !showFallback && (
        <div className="text-xs text-rose-600">{error}</div>
      )}

      {hasImages && uniqueImages.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Galería ({uniqueImages.length} imagen{uniqueImages.length > 1 ? 'es' : ''})
          </div>
          
          <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100">
            <div className="flex gap-2.5 pb-2">
              {uniqueImages.map((img, index) => (
                <button
                  key={img.id || `${img.image_url}-${index}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={`min-w-[76px] w-[76px] overflow-hidden rounded-xl border-2 transition-all shrink-0 ${
                    selected === index
                      ? 'border-blue-900 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt={`Miniatura ${index + 1}`} className="h-16 w-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default ProductGalleryCarousel;
