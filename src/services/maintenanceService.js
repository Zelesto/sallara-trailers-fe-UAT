// src/services/maintenanceService.js
import api from './api';

const toCamelCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  const result = {};
  Object.keys(data).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = data[key];
  });
  return result;
};

export const maintenanceService = {
  getMaintenanceSchedule: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/maintenance`);
      const data = response?.data || response;
      if (Array.isArray(data)) {
        return data.map(item => toCamelCase(item));
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
      throw error;
    }
  },

  addMaintenance: async (maintenanceData) => {
    try {
      const response = await api.post('/vehicles/maintenance', maintenanceData);
      return toCamelCase(response?.data || response);
    } catch (error) {
      console.error('Error adding maintenance:', error);
      throw error;
    }
  },

  updateMaintenance: async (id, maintenanceData) => {
    try {
      const response = await api.put(`/vehicles/maintenance/${id}`, maintenanceData);
      return toCamelCase(response?.data || response);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      throw error;
    }
  },

  deleteMaintenance: async (id) => {
    try {
      const response = await api.delete(`/vehicles/maintenance/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      throw error;
    }
  },
};

export default maintenanceService;
