import axiosInstance from './axiosInstance';

export const adminApi = {
  // Dashboard Overview & Analytics
  getStats: async () => {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await axiosInstance.get('/admin/dashboard/analytics');
    return response.data;
  },

  // Packages Management
  getAllPackages: async () => {
    const response = await axiosInstance.get('/packages/admin/all');
    return response.data;
  },

  createPackage: async (payload) => {
    const response = await axiosInstance.post('/packages', payload);
    return response.data;
  },

  updatePackage: async (id, payload) => {
    const response = await axiosInstance.put(`/packages/${id}`, payload);
    return response.data;
  },

  togglePackageAvailability: async (id, available) => {
    const response = await axiosInstance.patch(`/packages/${id}/availability`, null, {
      params: { available },
    });
    return response.data;
  },

  deletePackage: async (id) => {
    await axiosInstance.delete(`/packages/${id}`);
  },

  // Bookings Management (Paginated & Filtered)
  getBookings: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosInstance.get('/admin/bookings', { params: cleanParams });
    return response.data;
  },

  updateBookingStatus: async (id, payload) => {
    const response = await axiosInstance.patch(`/admin/bookings/${id}/status`, payload);
    return response.data;
  },

  // Customer Management (Paginated & Filtered)
  getCustomers: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosInstance.get('/admin/customers', { params: cleanParams });
    return response.data;
  },

  getCustomerDetail: async (id) => {
    const response = await axiosInstance.get(`/admin/customers/${id}`);
    return response.data;
  },

  updateCustomerStatus: async (id, active) => {
    const response = await axiosInstance.patch(`/admin/customers/${id}/status`, { active });
    return response.data;
  },

  // Contact Enquiries Management (Paginated & Filtered)
  getEnquiries: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosInstance.get('/admin/enquiries', { params: cleanParams });
    return response.data;
  },

  updateEnquiryStatus: async (id, status) => {
    const response = await axiosInstance.patch(`/admin/enquiries/${id}/status`, { status });
    return response.data;
  },
};
