// src/services/enumService.js
import api from './api';

export const enumService = {
  getEnums: async (enumType) => {
    const response = await api.get(`/enums/${enumType}`);
    return response.data;
  },

  getEnumsPaginated: async (params = {}) => {
    const response = await api.get('/enums', { params });
    return response.data;
  },

  getEnumTypes: async () => {
    try {
      const response = await api.get('/enums/types');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return ['VEHICLE_TYPE', 'VEHICLE_STATUS', 'DRIVER_STATUS', 'LOAD_STATUS'];
    } catch (error) {
      console.error('Error fetching enum types, using defaults:', error);
      return ['VEHICLE_TYPE', 'VEHICLE_STATUS', 'DRIVER_STATUS', 'LOAD_STATUS'];
    }
  },

  addCustomEnum: async (data) => {
    const response = await api.post('/enums/custom', data);
    return response.data;
  },

  updateCustomEnum: async (id, data) => {
    const response = await api.put(`/enums/custom/${id}`, data);
    return response.data;
  },

  deleteCustomEnum: async (id, enumType) => {
    await api.delete(`/enums/custom/${id}`, {
      params: { enumType }
    });
  },

  toggleEnumStatus: async (id, enumType) => {
    const response = await api.patch(`/enums/custom/${id}/toggle`, null, {
      params: { enumType }
    });
    return response.data;
  }
};
