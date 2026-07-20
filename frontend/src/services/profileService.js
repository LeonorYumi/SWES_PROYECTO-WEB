import { getById, updateResource, uploadFile } from './crudService';

export const getProfile = async (id) => {
  if (!id) throw new Error('No se proporcionó userId para obtener perfil');
  return getById('users', id);
};

export const updateProfile = async (id, updates) => {
  if (!id) throw new Error('No se proporcionó userId para actualizar perfil');
  return updateResource('users', id, updates);
};

export const uploadAvatar = async (file, userId) => {
  if (!file) throw new Error('No se proporcionó archivo para el avatar');
  if (!userId) throw new Error('No se proporcionó userId para subir avatar');
  return uploadFile('users', userId, 'avatar', file, 'file');
};

export default {
  getProfile,
  updateProfile,
  uploadAvatar,
};