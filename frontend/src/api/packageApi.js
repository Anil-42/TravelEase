import axiosInstance from './axiosInstance';

export const packageApi = {
  getAllPackages: async () => {
    const response = await axiosInstance.get('/packages');
    return response.data;
  },

  getPagedPackages: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosInstance.get('/packages/paged', { params: cleanParams });
    return response.data;
  },

  getPackageById: async (id) => {
    const response = await axiosInstance.get(`/packages/${id}`);
    return response.data;
  },
};
