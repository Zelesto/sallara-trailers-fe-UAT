// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
generateTripReport: async (tripNumber) => {
  try {
    console.log('📤 Generating trip report for:', tripNumber);

    // api.post() returns the parsed body directly in this project.
    const body = await api.post(`/reports/trip/${encodeURIComponent(tripNumber)}`, null, {
      params: { format: 'html' },
    });

    console.log('📥 Raw report body:', body);
    console.log('📥 Body type:', typeof body);
    console.log('📥 Body keys:', body && typeof body === 'object' ? Object.keys(body) : []);

    if (!body || typeof body !== 'object') {
      throw new Error('Report API returned a non-object response');
    }

    if (body.success !== true) {
      throw new Error(body.error || 'Report generation failed');
    }

    const htmlContent = body.content;
    if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
      throw new Error('Report API returned empty HTML content');
    }

    console.log('📥 HTML content length:', htmlContent.length);
    console.log('📥 HTML preview:', htmlContent.slice(0, 100));

    return htmlContent;
  } catch (error) {
    console.error('❌ Error generating trip report:', error);
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
