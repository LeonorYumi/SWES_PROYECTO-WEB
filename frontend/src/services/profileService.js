
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return { headers };
};

export const getProfile = async (id) => {
  if (!id) throw new Error('No se proporcionó userId');
  
  try {
    const response = await axios.get(
      `${BACKEND}/users/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error en getProfile:', error);
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const updateProfile = async (id, updates) => {
  if (!id) throw new Error('No se proporcionó userId');
  
  try {
    const response = await axios.put(
      `${BACKEND}/users/${id}`,
      updates,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error en updateProfile:', error);
    throw error;
  }
};

export const uploadAvatar = async (file, userId) => {
  if (!file) throw new Error('No se proporcionó archivo');
  if (!userId) throw new Error('No se proporcionó userId');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.post(
      `${BACKEND}/users/${userId}/avatar`,
      formData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error en uploadAvatar:', error);
    throw error;
  }
};

export const deleteAvatar = async (userId) => {
  if (!userId) throw new Error('No se proporcionó userId');
  
  try {
    const response = await axios.delete(
      `${BACKEND}/users/${userId}/avatar`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error en deleteAvatar:', error);
    throw error;
  }
};

export default {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar
};