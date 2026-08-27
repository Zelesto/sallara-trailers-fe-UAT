// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate a trip report
   */
  generateTripReport: async (tripNumber, format = 'html') => {
    try {
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format },
        responseType: format === 'html' ? 'text' : 'blob',
      });

      if (response.status === 200) {
        if (format === 'html') {
          return {
            success: true,
            data: response.data,
          };
        } else {
          // For PDF/Excel downloads
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `Trip_Report_${tripNumber}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          return {
            success: true,
            data: response.data,
          };
        }
      }

      throw new Error('Failed to generate report');
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },
};

export default reportService;
