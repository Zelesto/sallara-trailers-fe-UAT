// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      console.log('📤 Generating trip report for:', tripNumber);
      
      // ✅ Remove responseType: 'text' - let axios handle JSON
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        // ❌ REMOVE: responseType: 'text',
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data type:', typeof response.data);
      console.log('📥 Response data keys:', Object.keys(response.data || {}));
      
      // ✅ Handle JSON response
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          const htmlContent = response.data.content || '';
          console.log('📥 HTML content length:', htmlContent.length);
          console.log('📥 HTML preview:', htmlContent.substring(0, 100));
          
          // Validate it's HTML
          if (htmlContent && htmlContent.trim().startsWith('<')) {
            return htmlContent;
          } else {
            console.warn('⚠️ Content does not start with <, might be escaped');
            // Try to decode if needed
            if (htmlContent.includes('&lt;')) {
              const decoded = decodeHtmlEntities(htmlContent);
              if (decoded.trim().startsWith('<')) {
                return decoded;
              }
            }
            return htmlContent; // Return as is
          }
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      // Fallback: If response is a string
      if (typeof response.data === 'string') {
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return parsed.content;
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating trip report:', error);
      
      // Check if error response has content we can use
      if (error.response && error.response.data) {
        console.error('❌ Error response:', error.response.data);
        
        if (typeof error.response.data === 'object' && error.response.data.content) {
          return error.response.data.content;
        }
        if (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
          return error.response.data;
        }
      }
      
      throw error;
    }
  },

  /**
   * Generate load report - returns HTML content
   */
  generateLoadReport: async (loadNumber) => {
    try {
      console.log('📤 Generating load report for:', loadNumber);
      
      const response = await api.post(`/reports/load/${loadNumber}`, null, {
        params: { format: 'html' },
      });
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          const htmlContent = response.data.content || '';
          if (htmlContent && htmlContent.trim().startsWith('<')) {
            return htmlContent;
          }
          return htmlContent;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating load report:', error);
      
      if (error.response?.data?.content) {
        return error.response.data.content;
      }
      throw error;
    }
  },

  /**
   * Generate fuel report - returns HTML content
   */
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
      });
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          const htmlContent = response.data.content || '';
          if (htmlContent && htmlContent.trim().startsWith('<')) {
            return htmlContent;
          }
          return htmlContent;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating fuel report:', error);
      
      if (error.response?.data?.content) {
        return error.response.data.content;
      }
      throw error;
    }
  },
};

/**
 * Helper: Decode HTML entities (fallback if needed)
 */
function decodeHtmlEntities(html) {
  if (!html || typeof html !== 'string') return html;
  
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  } catch (e) {
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
}

export default reportService;
