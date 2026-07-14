// src/services/depotService.js
import api from './api';

export const depotService = {
  getAllDepots: async () => {
    try {
      const response = await api.get('/depots');
      return response;
    } catch (error) {
      console.error('Error fetching depots:', error);
      return [];
    }
  },

  getDepotById: async (id) => {
    try {
      const response = await api.get(`/depots/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching depot:', error);
      throw error;
    }
  },

  createDepot: async (depotData) => {
    try {
      const response = await api.post('/depots', depotData);
      return response;
    } catch (error) {
      console.error('Error creating depot:', error);
      throw error;
    }
  },

  updateDepot: async (id, depotData) => {
    try {
      const response = await api.put(`/depots/${id}`, depotData);
      return response;
    } catch (error) {
      console.error('Error updating depot:', error);
      throw error;
    }
  },

  deleteDepot: async (id) => {
    try {
      const response = await api.delete(`/depots/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting depot:', error);
      throw error;
    }
  }
};
