// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
      });
      
      // ✅ Handle both JSON and HTML responses
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      // Fallback: if response is HTML directly (backward compatibility)
      if (typeof response.data === 'string') {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('Error generating trip report:', error);
      throw error;
    }
  },

  generateLoadReport: async (loadNumber) => {
    try {
      const response = await api.post(`/reports/load/${loadNumber}`, null, {
        params: { format: 'html' },
      });
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string') {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('Error generating load report:', error);
      throw error;
    }
  },

  generateFuelReport: async (vehicleId, startDate, endDate) => {
    try {
      const response = await api.post('/reports/fuel', null, {
        params: { vehicleId, startDate, endDate, format: 'html' },
      });
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string') {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('Error generating fuel report:', error);
      throw error;
    }
  },
};

export default reportService;
