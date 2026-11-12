// src/services/depotService.js
import api, { unwrapApiResponse } from './api';

export const depotService = {
  getAllDepots: async () => {
    try {
      const response = await api.get('/depots');
      const data = unwrapApiResponse(response, []);
      console.log('📦 Depot response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching depots:', error);
      return [];
    }
  },

  getActiveDepots: async () => {
    try {
      const response = await api.get('/depots/active');
      return Array.isArray(response) ? response : (response?.content || []);
    } catch (error) {
      console.error('Error fetching active depots:', error);
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

  getDepotByCode: async (depotCode) => {
    try {
      const response = await api.get(`/depots/code/${depotCode}`);
      return response;
    } catch (error) {
      console.error('Error fetching depot by code:', error);
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

  toggleDepotStatus: async (id) => {
    try {
      const response = await api.patch(`/depots/${id}/toggle`);
      return response;
    } catch (error) {
      console.error('Error toggling depot status:', error);
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
