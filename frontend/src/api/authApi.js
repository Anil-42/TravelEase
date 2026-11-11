import axiosInstance from './axiosInstance';

export const authApi = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  changePassword: async (passwords) => {
    const response = await axiosInstance.put('/auth/change-password', passwords);
    return response.data;
  },

  forgotPassword: async (emailData) => {
    const response = await axiosInstance.post('/auth/forgot-password', emailData);
    return response.data;
  },

  resetPassword: async (resetData) => {
    const response = await axiosInstance.post('/auth/reset-password', resetData);
    return response.data;
  },
};
