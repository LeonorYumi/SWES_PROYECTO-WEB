import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api';

const apiClient = axios.create({ baseURL: BACKEND });

const clearSessionAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('uid');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
  localStorage.removeItem('name');
  localStorage.removeItem('phone');
  window.location.href = `${window.location.origin}/login?sessionExpired=1`;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } else {
    config.headers = {
      ...config.headers,
      'Content-Type': 'application/json',
    };
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);

// Función auxiliar interna para obtener las cabeceras con el token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');

  console.log('🔐 getAuthHeaders():');
  console.log('   Token disponible:', token ? '✅ Sí' : '❌ No');
  
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log('   Header Authorization:', 'Bearer ' + token.slice(0, 20) + '...');
  } else {
    console.warn('   ⚠️ ADVERTENCIA: No hay token en localStorage');
  }

  return { headers };
};

export const getAll = async (resource) => {
  console.log(`📥 GET /${resource}`);
  const res = await apiClient.get(`/${resource}`);
  return res.data;
};

export const getById = async (resource, id) => {
  console.log(`📥 GET /${resource}/${id}`);
  const res = await apiClient.get(`/${resource}/${id}`);
  return res.data;
};

export const getByUserId = async (resource, userId) => {
  console.log(`📥 GET /${resource}/user/${userId}`);
  const res = await apiClient.get(`/${resource}/user/${userId}`);
  return res.data;
};

export const createResource = async (resource, data) => {
  console.log(`📝 POST /${resource}`, data);
  const res = await apiClient.post(`/${resource}`, data);
  console.log(`Respuesta del servidor al CREAR ${resource}:`, res.data);
  return res.data;
};

export const updateResource = async (resource, id, data) => {
  console.log(`✏️ PUT /${resource}/${id}`, data);
  const res = await apiClient.put(`/${resource}/${id}`, data);
  console.log(`Respuesta del servidor al EDITAR ${resource}:`, res.data);
  return res.data;
};

export const createProductImages = async (productId, images, primaryImageUrl = null) => {
  console.log(`🖼️ POST /products/${productId}/images`, { images, primaryImageUrl });
  const res = await apiClient.post(`/products/${productId}/images`, { images, primaryImageUrl });
  return res.data;
};

export const getProductImages = async (productId) => {
  console.log(`📥 GET /products/${productId}/images`);
  const res = await apiClient.get(`/products/${productId}/images`);
  return res.data;
};

export const deleteResource = async (resource, id) => {
  console.log(`🗑️ DELETE /${resource}/${id}`);
  const res = await apiClient.delete(`/${resource}/${id}`);
  return res.data;
};

export default { 
  getAll, 
  getById, 
  getByUserId, 
  createResource, 
  createProductImages, 
  updateResource, 
  deleteResource 
};