// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      console.log('📤 Generating trip report for:', tripNumber);
      
      // ✅ Force response type to text to handle HTML
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        responseType: 'text', // ✅ Important: tell axios to return text
      });
      
      console.log('📥 Response type:', typeof response.data);
      console.log('📥 Response preview:', response.data?.substring(0, 100));
      
      // ✅ If response is a string (HTML), return it directly
      if (typeof response.data === 'string') {
        // Check if it looks like HTML
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        // Try to parse as JSON if it looks like JSON
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return parsed.content;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          // Not JSON, return as is
        }
        return response.data;
      }
      
      // ✅ Handle JSON response (if backend returns JSON)
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating trip report:', error);
      
      // If error response has HTML content, return it
      if (error.response && typeof error.response.data === 'string') {
        if (error.response.data.trim().startsWith('<')) {
          return error.response.data; // Return error HTML
        }
      }
      
      throw error;
    }
  },

  generateLoadReport: async (loadNumber) => {
    try {
      console.log('📤 Generating load report for:', loadNumber);
      
      const response = await api.post(`/reports/load/${loadNumber}`, null, {
        params: { format: 'html' },
        responseType: 'text',
      });
      
      console.log('📥 Response type:', typeof response.data);
      
      if (typeof response.data === 'string') {
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return parsed.content;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating load report:', error);
      
      if (error.response && typeof error.response.data === 'string') {
        if (error.response.data.trim().startsWith('<')) {
          return error.response.data;
        }
      }
      
      throw error;
    }
  },

  generateFuelReport: async (vehicleId, startDate, endDate) => {
    try {
      console.log('📤 Generating fuel report');
      
      const params = {};
      if (vehicleId) params.vehicleId = vehicleId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.format = 'html';
      
      const response = await api.post('/reports/fuel', null, {
        params,
        responseType: 'text',
      });
      
      console.log('📥 Response type:', typeof response.data);
      
      if (typeof response.data === 'string') {
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return parsed.content;
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success) {
          return response.data.content;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating fuel report:', error);
      
      if (error.response && typeof error.response.data === 'string') {
        if (error.response.data.trim().startsWith('<')) {
          return error.response.data;
        }
      }
      
      throw error;
    }
  },
};

export default reportService;
