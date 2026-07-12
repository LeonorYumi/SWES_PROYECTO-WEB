import { useEffect, useState } from 'react';
import { uploadProductImages } from '../services/supabaseStorageService';
import { getProductImages } from '../services/crudService';

const isValidImageUrl = (url) => {
  try {
    const parsed = new URL(url.trim());
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const parseUrlList = (text) => {
  return text
    .split(/\r?\n|,/) 
    .map((line) => line.trim())
    .filter(Boolean);
};

function ProductImagesUploader({ productId, onUploadComplete, maxImages = 5 }) {
  const [files, setFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [primarySelection, setPrimarySelection] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const urlList = parseUrlList(imageUrls);
  const previewItems = [...files.map((file, index) => ({
    id: `file-${index}-${file.name}`,
    label: file.name,
    image_url: null,
    source: 'file',
  })),
  ...urlList.map((url, index) => ({
    id: `url-${index}-${url}`,
    label: url,
    image_url: url,
    source: 'url',
  }))];

  const pendingCount = files.length + urlList.length;
  const remainingSlots = Math.max(0, maxImages - existingCount - pendingCount);
  const canUploadMore = existingCount + urlList.length < maxImages;

  useEffect(() => {
    if (previewItems.length && (primarySelection === null || primarySelection >= previewItems.length)) {
      setPrimarySelection(0);
      return;
    }
    if (previewItems.length === 0 && primarySelection !== null) {
      setPrimarySelection(null);
    }
  }, [previewItems.length, primarySelection]);

  const handleFilesChange = (event) => {
    setError('');
    const selectedFiles = Array.from(event.target.files || []);
    const availableSlots = Math.max(0, maxImages - existingCount - urlList.length);

    if (!canUploadMore) {
      setError(`Ya alcanzaste el límite de ${maxImages} imágenes para este producto.`);
      event.target.value = '';
      return;
    }

    if (selectedFiles.length > availableSlots) {
      setError(`Solo puedes agregar ${availableSlots} imagen${availableSlots === 1 ? '' : 'es'} más.`);
      event.target.value = '';
      return;
    }

    const valid = selectedFiles.every((file) => file.type.startsWith('image/'));
    if (!valid) {
      setError('Solo se aceptan imágenes en formato JPG, PNG, WEBP o GIF.');
      event.target.value = '';
      return;
    }

    setFiles(selectedFiles);
    event.target.value = ''; // Reset input
  };

  useEffect(() => {
    if (!productId) return;

    const fetchExistingImages = async () => {
      try {
        const existing = await getProductImages(productId);
        setExistingCount(existing?.length || 0);
      } catch (error) {
        console.error('Error fetching existing product images:', error);
      }
    };

    fetchExistingImages();
  }, [productId]);

  const handleUrlsChange = (event) => {
    setError('');
    const nextUrls = parseUrlList(event.target.value);
    const totalWithUrls = existingCount + files.length + nextUrls.length;

    if (totalWithUrls > maxImages) {
      setError(`Máximo ${maxImages} imágenes en total. Puedes agregar hasta ${Math.max(0, maxImages - existingCount - files.length)} más.`);
    }

    setImageUrls(event.target.value);
  };

  const selectedPrimary = previewItems[primarySelection]?.image_url || previewItems[primarySelection]?.label;

  const handleUpload = async () => {
    const urls = urlList;
    const totalImages = existingCount + files.length + urls.length;

    if (!files.length && !urls.length) {
      setError('Selecciona al menos una imagen o ingresa una URL.');
      return;
    }

    if (totalImages > maxImages) {
      setError(`Máximo ${maxImages} imágenes en total por producto. Ya hay ${existingCount} imágenes guardadas.`);
      return;
    }

    const invalidUrls = urls.filter((url) => !isValidImageUrl(url));
    if (invalidUrls.length > 0) {
      setError('Asegúrate de ingresar URLs válidas de imágenes JPG, PNG, WEBP o GIF.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const uploadedFiles = files.length ? await uploadProductImages(files, productId) : [];
      const uploadedFilesPayload = uploadedFiles.map((file) => ({
        image_url: file.url,
        storage_path: file.path || file.storage_path || null,
      }));
      const uploadedUrls = urls.map((url) => ({ image_url: url }));
      const uploaded = [...uploadedFilesPayload, ...uploadedUrls];

      const primaryImageUrl = uploaded[primarySelection]?.image_url || selectedPrimary || uploaded[0]?.image_url || null;
      onUploadComplete(uploaded, primaryImageUrl);
      setFiles([]);
      setImageUrls('');
      setExistingCount((prevCount) => prevCount + uploaded.length);
      if (uploaded.length) {
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-gray-500">Galería de imágenes</label>
      <div className="text-[11px] text-slate-500">
        {existingCount > 0
          ? `Ya hay ${existingCount} imagen${existingCount > 1 ? 'es' : ''} guardada${existingCount > 1 ? '' : ''}.`
          : 'Aún no hay imágenes en la galería del producto.'}
      </div>
      <div className="text-[11px] text-slate-500">
        {remainingSlots > 0
          ? `Puedes subir hasta ${remainingSlots} imagen${remainingSlots === 1 ? '' : 'es'} más.`
          : 'Has alcanzado el límite de 5 imágenes para este producto.'}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        key={files.length}
        onChange={handleFilesChange}
        disabled={remainingSlots === 0}
        className="block w-full text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
      />

      <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <label className="text-xs font-semibold text-slate-600">O ingresa URLs de imágenes</label>
        <textarea
          rows={4}
          value={imageUrls}
          onChange={handleUrlsChange}
          disabled={remainingSlots === 0}
          placeholder="https://ejemplo.com/imagen1.jpg\nhttps://ejemplo.com/imagen2.png"
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="text-[11px] text-slate-400">
          Una URL por línea o separadas por comas. Puedes combinar imágenes locales y URLs.
        </div>
      </div>

      {(files.length > 0 || urlList.length > 0) && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-semibold text-slate-600">
            {files.length + urlList.length} imagen{files.length + urlList.length > 1 ? 'es' : ''} preparadas para subir
          </div>
          <div className="space-y-2">
            {previewItems.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-xs text-slate-600">
                <div className="min-w-0 truncate">
                  <span className="font-semibold text-slate-700">{item.source === 'file' ? item.label : item.image_url}</span>
                  <div className="text-[11px] text-slate-400">{item.source === 'file' ? 'Archivo local' : 'URL externa'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrimarySelection(index)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${primarySelection === index ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {primarySelection === index ? 'Principal' : 'Marcar principal'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || (!files.length && !urlList.length)}
        className="mt-2 rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? 'Subiendo...' : 'Subir imágenes'}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default ProductImagesUploader;
