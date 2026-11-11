import axiosInstance from './axiosInstance';

export const bookingApi = {
  createBooking: async (bookingData) => {
    const response = await axiosInstance.post('/bookings', bookingData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await axiosInstance.get('/bookings/my');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axiosInstance.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await axiosInstance.patch(`/bookings/${id}/cancel`);
    return response.data;
  },
};
