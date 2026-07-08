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
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden rounded-3xl bg-gray-100 aspect-[16/9]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-500">Cargando imágenes...</div>
        ) : currentImage ? (
          <>
            <img
              src={currentImage}
              alt={hasImages ? `Galería ${selected + 1}` : 'Imagen del producto'}
              className="h-full w-full object-cover"
            />
            {uniqueImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-3 shadow-lg text-gray-700 hover:bg-white"
                  aria-label="Imagen anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-3 shadow-lg text-gray-700 hover:bg-white"
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
          <div className="flex gap-3 overflow-x-auto pb-1">
            {uniqueImages.map((img, index) => (
              <button
                key={img.id || `${img.image_url}-${index}`}
                type="button"
                onClick={() => setSelected(index)}
                className={`min-w-[100px] overflow-hidden rounded-2xl border ${selected === index ? 'border-blue-900 ring-2 ring-blue-200' : 'border-gray-200'} transition-all shrink-0`}
              >
                <img src={img.image_url} alt={`Miniatura ${index + 1}`} className="h-24 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGalleryCarousel;
