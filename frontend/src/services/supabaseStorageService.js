import { supabase } from '../../supabaseClient';

const getSafeFileName = (file) => {
  const safeBase = file.name ? file.name.replace(/\s+/g, '_') : `file-${Date.now()}`;
  return `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeBase}`;
};

const uploadFileToBucket = async (file, bucketCandidates, folder) => {
  if (!file) return null;

  const attemptedBuckets = Array.isArray(bucketCandidates) ? bucketCandidates : [bucketCandidates];
  let lastError = null;

  for (const bucket of attemptedBuckets) {
    try {
      const filePath = `${folder}/${getSafeFileName(file)}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

      if (error) {
        lastError = error;
        continue;
      }

      const { data: publicData, error: urlError } = await supabase.storage.from(bucket).getPublicUrl(filePath);
      if (urlError) {
        lastError = urlError;
        continue;
      }

      return {
        path: filePath,
        url: publicData?.publicUrl,
        bucket,
      };
    } catch (err) {
      lastError = err;
    }
  }

  const message = lastError?.message || 'Error al subir el archivo a Supabase Storage';
  throw new Error(message);
};

export const uploadProductImages = async (files, productId) => {
  if (!files || !files.length) return [];
  const folder = `products/${productId}`;
  const bucketCandidates = ['product-images', 'products', 'product_images'];

  const uploaded = [];
  for (const file of files) {
    const result = await uploadFileToBucket(file, bucketCandidates, folder);
    if (result?.url) {
      uploaded.push(result);
    }
  }
  return uploaded;
};

export const uploadAvatarImage = async (file, userId) => {
  if (!file) return null;
  const folder = `users/${userId}`;
  const bucketCandidates = ['avatars', 'avatars-images'];
  const result = await uploadFileToBucket(file, bucketCandidates, folder);
  return result;
};

export default {
  uploadProductImages,
  uploadAvatarImage,
};