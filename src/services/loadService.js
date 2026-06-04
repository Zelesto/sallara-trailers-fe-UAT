// src/services/loadService.js
import api from './api';

export const loadService = {
  async getAllLoads() {
    const response = await api.get('/loads');
    return response;
  },

  async getAvailableLoads() {
    const response = await api.get('/loads/available');
    return response;
  }
};
