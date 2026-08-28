// src/services/reportService.js

import api from './api';

export const reportService = {
  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      console.log('📤 Generating trip report for:', tripNumber);
      
      // ✅ Let axios handle JSON response normally
      const response = await api.post(`/reports/trip/${tripNumber}`, null, {
        params: { format: 'html' },
        // Remove responseType: 'text' - we want JSON
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response type:', typeof response.data);
      console.log('📥 Response keys:', Object.keys(response.data || {}));
      
      // ✅ Handle JSON response from backend
      if (response.data && typeof response.data === 'object') {
        // Check for success
        if (response.data.success === true) {
          // Extract HTML content
          let htmlContent = response.data.content || '';
          
          // If content appears to be HTML-escaped, decode it
          if (htmlContent && htmlContent.includes('&lt;') || htmlContent.includes('&gt;')) {
            htmlContent = decodeHtmlEntities(htmlContent);
            console.log('📥 Decoded HTML content (first 100 chars):', htmlContent.substring(0, 100));
          }
          
          return htmlContent;
        } else {
          // Handle error response
          const errorMsg = response.data.error || 'Report generation failed';
          console.error('❌ Report generation error:', errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      // Fallback: If response is a string (for backwards compatibility)
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
          // Not JSON, return as is
        }
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating trip report:', error);
      
      // Check if error response has content we can use
      if (error.response) {
        console.error('❌ Error response status:', error.response.status);
        console.error('❌ Error response data:', error.response.data);
        
        // If error response has HTML content, return it
        if (error.response.data && typeof error.response.data === 'object') {
          if (error.response.data.content) {
            let htmlContent = error.response.data.content;
            if (htmlContent && (htmlContent.includes('&lt;') || htmlContent.includes('&gt;'))) {
              htmlContent = decodeHtmlEntities(htmlContent);
            }
            return htmlContent;
          }
          if (error.response.data.error) {
            throw new Error(error.response.data.error);
          }
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
      
      console.log('📥 Response status:', response.status);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success === true) {
          let htmlContent = response.data.content || '';
          if (htmlContent && (htmlContent.includes('&lt;') || htmlContent.includes('&gt;'))) {
            htmlContent = decodeHtmlEntities(htmlContent);
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
            return parsed.content;
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating load report:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.content) {
          let htmlContent = error.response.data.content;
          if (htmlContent && (htmlContent.includes('&lt;') || htmlContent.includes('&gt;'))) {
            htmlContent = decodeHtmlEntities(htmlContent);
          }
          return htmlContent;
        }
        if (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
          return error.response.data;
        }
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
          if (htmlContent && (htmlContent.includes('&lt;') || htmlContent.includes('&gt;'))) {
            htmlContent = decodeHtmlEntities(htmlContent);
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
            return parsed.content;
          }
        } catch (e) {
          // Not JSON
        }
        return response.data;
      }
      
      throw new Error('Unexpected response format');
      
    } catch (error) {
      console.error('❌ Error generating fuel report:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.content) {
          let htmlContent = error.response.data.content;
          if (htmlContent && (htmlContent.includes('&lt;') || htmlContent.includes('&gt;'))) {
            htmlContent = decodeHtmlEntities(htmlContent);
          }
          return htmlContent;
        }
        if (typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
          return error.response.data;
        }
      }
      
      throw error;
    }
  },
};

/**
 * Helper function to decode HTML entities
 */
function decodeHtmlEntities(html) {
  if (!html) return '';
  
  // Create a temporary element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
}

/**
 * Alternative: Manual decoding (safer)
 */
function decodeHtmlEntitiesManual(html) {
  if (!html) return '';
  
  const entities = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&apos;': "'",
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };
  
  let decoded = html;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }
  
  // Handle numeric entities like &#123;
  decoded = decoded.replace(/&#([0-9]+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Handle hex entities like &#x123;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decoded;
}

export default reportService;
