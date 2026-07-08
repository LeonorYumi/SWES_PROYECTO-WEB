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
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const urlList = parseUrlList(imageUrls);
  const totalSelected = existingCount + files.length + urlList.length;
  const allowedRemaining = Math.max(0, maxImages - existingCount - urlList.length);

  const handleFilesChange = (event) => {
    setError('');
    const selectedFiles = Array.from(event.target.files || []);
    const totalImages = existingCount + selectedFiles.length + urlList.length;

    if (totalImages > maxImages) {
      setError(`Puedes subir un máximo de ${maxImages} imágenes en total por producto.`);
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
    setImageUrls(event.target.value);
  };

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

      onUploadComplete(uploaded);
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
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800"
      />

      <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
        <label className="text-xs font-semibold text-slate-600">O ingresa URLs de imágenes</label>
        <textarea
          rows={4}
          value={imageUrls}
          onChange={handleUrlsChange}
          placeholder="https://ejemplo.com/imagen1.jpg\nhttps://ejemplo.com/imagen2.png"
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
          <ul className="space-y-1 text-xs text-slate-500">
            {files.map((file) => (
              <li key={file.name} className="truncate">• {file.name}</li>
            ))}
            {urlList.map((url, index) => (
              <li key={`${url}-${index}`} className="truncate">• {url}</li>
            ))}
          </ul>
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
