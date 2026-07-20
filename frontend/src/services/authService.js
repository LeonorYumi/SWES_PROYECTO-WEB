// frontend/src/services/authService.js
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

export const registerUser = async (userData) => {
  const response = await axios.post(`${BACKEND}/register`, userData);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await axios.post(`${BACKEND}/login`, { email, password });
  return response.data;
};

export const updateUser = async (id, updates) => {
  const response = await axios.put(`${BACKEND}/users/${id}`, updates, getAuthHeaders());
  return response.data;
};

export const verifyAccount = async (token) => {
  const response = await axios.get(`${BACKEND}/verify/${token}`);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axios.post(`${BACKEND}/forgot-password`, { email });
  return response.data;
};

export const resetPasswordWithCode = async (email, code, newPassword) => {
  const response = await axios.post(`${BACKEND}/reset-password-code`, { email, code, newPassword });
  return response.data;
};

export const changePassword = async (newPassword) => {
  const response = await axios.post(`${BACKEND}/change-password`, { newPassword }, getAuthHeaders());
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await axios.post(`${BACKEND}/reset-password`, { token, newPassword });
  return response.data;
};

export const googleSignIn = async (accessToken) => {
  const response = await axios.post(`${BACKEND}/google`, { accessToken });
  return response.data;
};

export const checkActiveSession = async () => {
  try {
    const response = await axios.get(`${BACKEND}/session/active`, getAuthHeaders());
    return response.data;
  } catch (error) {
    return { active: false };
  }
};


export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('uid');
  localStorage.removeItem('name');
  localStorage.removeItem('email');
  localStorage.removeItem('phone');
  localStorage.removeItem('avatar_url');
  localStorage.removeItem('user');
};

export default {
  registerUser,
  loginUser,
  updateUser,
  verifyAccount,
  forgotPassword,
  resetPasswordWithCode,
  changePassword,
  resetPassword,
  googleSignIn,
  checkActiveSession,
  logoutUser
};