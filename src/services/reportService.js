// src/services/reportService.js

import api from './api';

// Helper function to decode HTML entities
const decodeHtmlEntities = (html) => {
  if (!html || typeof html !== 'string') return html;
  
  // If it doesn't contain HTML entities, return as is
  if (!html.includes('&lt;') && !html.includes('&gt;') && !html.includes('&amp;')) {
    return html;
  }
  
  // Use DOMParser for reliable decoding
  try {
    const doc = new DOMParser().parseFromString(
      `<!DOCTYPE html><html><body><div id="content">${html}</div></body></html>`,
      'text/html'
    );
    const element = doc.getElementById('content');
    if (element) {
      return element.innerHTML;
    }
  } catch (e) {
    console.warn('DOMParser decoding failed, falling back to textarea');
  }
  
  // Fallback: Use textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  } catch (e) {
    console.warn('Textarea decoding failed, using manual replacement');
  }
  
  // Ultimate fallback: Manual replacement
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
};

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      console.log('📤 Generating trip report for:', tripNumber);
      
      // ✅ Use responseType: 'json' to parse JSON properly
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        // ✅ Don't use responseType: 'text' - we want JSON
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response type:', typeof response.data);
      console.log('📥 Response data:', response.data);
      
      // ✅ Handle the response
      if (response.data && typeof response.data === 'object') {
        // Check for success
        if (response.data.success === true) {
          let htmlContent = response.data.content || '';
          console.log('📥 Raw content length:', htmlContent.length);
          console.log('📥 Raw content preview:', htmlContent.substring(0, 100));
          
          // ✅ DECODE the HTML entities
          const decodedHtml = decodeHtmlEntities(htmlContent);
          console.log('📥 Decoded content preview:', decodedHtml.substring(0, 100));
          
          // Check if it's valid HTML
          if (decodedHtml && decodedHtml.trim().startsWith('<')) {
            return decodedHtml;
          } else {
            console.error('❌ Decoded content is not HTML:', decodedHtml?.substring(0, 200));
            // Try returning the raw content as a fallback
            if (htmlContent && htmlContent.trim().startsWith('<')) {
              return htmlContent;
            }
            throw new Error('Invalid HTML content received');
          }
        } else {
          // Handle error from backend
          const errorMsg = response.data.error || 'Report generation failed';
          console.error('❌ Backend error:', errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      // ✅ Fallback: If response is a string
      if (typeof response.data === 'string') {
        console.log('📥 String response received');
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            const decoded = decodeHtmlEntities(parsed.content);
            return decoded;
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating trip report:', error);
      
      // ✅ Check if error response has data we can use
      if (error.response) {
        console.error('❌ Error response status:', error.response.status);
        console.error('❌ Error response data:', error.response.data);
        
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.content) {
            const decoded = decodeHtmlEntities(error.response.data.content);
            return decoded;
          }
          if (error.response.data.error) {
            throw new Error(error.response.data.error);
          }
        }
        
        if (typeof error.response.data === 'string') {
          if (error.response.data.trim().startsWith('<')) {
            return error.response.data;
          }
          try {
            const parsed = JSON.parse(error.response.data);
            if (parsed.content) {
              const decoded = decodeHtmlEntities(parsed.content);
              return decoded;
            }
          } catch (e) {
            // Not JSON
          }
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
      
      console.log('📥 Response status:', response.status);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          let htmlContent = response.data.content || '';
          const decoded = decodeHtmlEntities(htmlContent);
          if (decoded && decoded.trim().startsWith('<')) {
            return decoded;
          }
          return htmlContent;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string') {
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return decodeHtmlEntities(parsed.content);
          }
        } catch (e) {}
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating load report:', error);
      
      if (error.response?.data?.content) {
        return decodeHtmlEntities(error.response.data.content);
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
      
      console.log('📥 Response status:', response.status);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          let htmlContent = response.data.content || '';
          const decoded = decodeHtmlEntities(htmlContent);
          if (decoded && decoded.trim().startsWith('<')) {
            return decoded;
          }
          return htmlContent;
        } else {
          throw new Error(response.data.error || 'Report generation failed');
        }
      }
      
      if (typeof response.data === 'string') {
        if (response.data.trim().startsWith('<')) {
          return response.data;
        }
        try {
          const parsed = JSON.parse(response.data);
          if (parsed.success && parsed.content) {
            return decodeHtmlEntities(parsed.content);
          }
        } catch (e) {}
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating fuel report:', error);
      
      if (error.response?.data?.content) {
        return decodeHtmlEntities(error.response.data.content);
      }
      throw error;
    }
  },
};

export default reportService;
