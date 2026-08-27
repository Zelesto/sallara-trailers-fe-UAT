// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Check if BIRT is available on the backend
   */
  checkBirtAvailability: async () => {
    try {
      const response = await api.get('/reports/health');
      return response.data?.birtAvailable || false;
    } catch (error) {
      console.warn('BIRT health check failed:', error);
      return false;
    }
  },

  /**
   * Generate a trip report - tries BIRT first, falls back to HTML
   */
  generateTripReport: async (tripNumber, format = 'html') => {
    try {
      // Try BIRT first
      try {
        const response = await api.post(`/reports/trip/${tripNumber}`, null, {
          params: { format },
          responseType: format === 'html' ? 'text' : 'blob',
        });
        
        // If BIRT succeeded, return the response
        if (response.status === 200) {
          return {
            success: true,
            format: 'birt',
            data: response.data,
            contentType: format === 'html' ? 'text/html' : 'application/pdf',
          };
        }
      } catch (birtError) {
        console.warn('BIRT report generation failed, using HTML fallback:', birtError.message);
      }
      
      // Fallback: Get data for HTML viewer
      const fallbackResponse = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        headers: { 'Accept': 'application/json' },
      });
      
      if (fallbackResponse.data?.success === false) {
        throw new Error(fallbackResponse.data.error || 'Failed to generate report');
      }
      
      return {
        success: true,
        format: 'html',
        data: fallbackResponse.data,
        contentType: 'application/json',
      };
      
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },
};

export default reportService;
