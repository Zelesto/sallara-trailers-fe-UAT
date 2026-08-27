// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML directly
   */
  generateTripReport: async (tripNumber) => {
    try {
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        responseType: 'text', // ✅ Important: expect text response
      });
      // ✅ The response is HTML text directly
      return response.data;
    } catch (error) {
      console.error('Error generating trip report:', error);
      throw error;
    }
  },

  generateLoadReport: async (loadNumber) => {
    try {
      const response = await api.post(`/reports/load/${loadNumber}`, null, {
        params: { format: 'html' },
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating load report:', error);
      throw error;
    }
  },

  generateFuelReport: async (vehicleId, startDate, endDate) => {
    try {
      const response = await api.post('/reports/fuel', null, {
        params: { vehicleId, startDate, endDate, format: 'html' },
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating fuel report:', error);
      throw error;
    }
  },
};

export default reportService;
