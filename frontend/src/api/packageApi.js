import axiosInstance from './axiosInstance';

export const packageApi = {
  getAllPackages: async () => {
    const response = await axiosInstance.get('/packages');
    return response.data;
  },

  getPackageById: async (id) => {
    const response = await axiosInstance.get(`/packages/${id}`);
    return response.data;
  },
};
