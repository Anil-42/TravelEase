import axiosInstance from './axiosInstance';

export const contactApi = {
  submitInquiry: async (inquiryData) => {
    const response = await axiosInstance.post('/contact', inquiryData);
    return response.data;
  },
};
