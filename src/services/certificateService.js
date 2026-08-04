// src/services/certificateService.js
import api from './api';

const toCamelCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  // Simple camelCase conversion for certificate fields
  const result = {};
  Object.keys(data).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = data[key];
  });
  return result;
};

export const certificateService = {
  getCertificates: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/certificates`);
      const data = response?.data || response;
      if (Array.isArray(data)) {
        return data.map(cert => toCamelCase(cert));
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  },

  addCertificate: async (vehicleId, certificateData) => {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/certificates`, certificateData);
      return toCamelCase(response?.data || response);
    } catch (error) {
      console.error('Error adding certificate:', error);
      throw error;
    }
  },

  updateCertificate: async (vehicleId, certificateId, certificateData) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/certificates/${certificateId}`, certificateData);
      return toCamelCase(response?.data || response);
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  },

  deleteCertificate: async (vehicleId, certificateId) => {
    try {
      const response = await api.delete(`/vehicles/${vehicleId}/certificates/${certificateId}`);
      return response?.data || response;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  },
};

export default certificateService;
