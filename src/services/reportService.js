// src/services/reportService.js

import api from './api';

export const reportService = {
  // ============================================================
  // HTML REPORTS
  // ============================================================

  /**
   * Generate trip report - returns HTML content
   */
  generateTripReport: async (tripNumber) => {
    try {
      console.log('📤 Generating trip report for:', tripNumber);

      const body = await api.post(`/reports/trip/${encodeURIComponent(tripNumber)}`, null, {
        params: { format: 'html' },
      });

      console.log('📥 Raw report body:', body);

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

      const body = await api.post(`/reports/load/${encodeURIComponent(loadNumber)}`, null, {
        params: { format: 'html' },
      });

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

      return htmlContent;
    } catch (error) {
      console.error('❌ Error generating load report:', error);
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

      const body = await api.post('/reports/fuel', null, { params });

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

      return htmlContent;
    } catch (error) {
      console.error('❌ Error generating fuel report:', error);
      throw error;
    }
  },

  // ============================================================
  // PDF REPORTS
  // ============================================================

  /**
   * Download trip report as PDF
   */
  downloadTripReportPDF: async (tripNumber) => {
    try {
      console.log('📄 Downloading PDF trip report for:', tripNumber);

      const response = await api.post(
        `/reports/trip/${encodeURIComponent(tripNumber)}/pdf`,
        null,
        { responseType: 'blob' }
      );

      return downloadBlob(response.data, `trip-report-${tripNumber}.pdf`);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  },

  /**
   * Download load report as PDF
   */
  downloadLoadReportPDF: async (loadNumber) => {
    try {
      console.log('📄 Downloading PDF load report for:', loadNumber);

      const response = await api.post(
        `/reports/load/${encodeURIComponent(loadNumber)}/pdf`,
        null,
        { responseType: 'blob' }
      );

      return downloadBlob(response.data, `load-report-${loadNumber}.pdf`);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  },

  /**
   * Download fuel report as PDF
   */
  downloadFuelReportPDF: async (vehicleId, startDate, endDate) => {
    try {
      console.log('📄 Downloading PDF fuel report');

      const params = {};
      if (vehicleId) params.vehicleId = vehicleId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.post('/reports/fuel/pdf', null, {
        params,
        responseType: 'blob',
      });

      const filename = `fuel-report-${vehicleId || 'all'}.pdf`;
      return downloadBlob(response.data, filename);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  },
};

/**
 * Helper: Download blob as file
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  console.log('✅ PDF downloaded:', filename);
  return true;
}

export default reportService;
