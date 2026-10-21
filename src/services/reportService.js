// src/services/reportService.js

import api from './api';

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Download a blob as a file (browser only).
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

/**
 * POST to a report endpoint and return the HTML content.
 * Throws on non-object response, `success !== true`, or empty content.
 */
const generateHtmlReport = async (path, params = {}, label = 'report') => {
  try {
    console.log(`📤 Generating ${label}`, params);

    const body = await api.post(path, null, {
      params: { ...params, format: 'html' },
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

    console.log(`📥 ${label} HTML length:`, htmlContent.length);
    return htmlContent;
  } catch (error) {
    console.error(`❌ Error generating ${label}:`, error);
    throw error;
  }
};

/**
 * POST to a report PDF endpoint and trigger a blob download.
 */
const downloadPdfReport = async (path, params = {}, filename, label = 'report') => {
  try {
    console.log(`📄 Downloading ${label} PDF`);

    const response = await api.post(path, null, {
      params,
      responseType: 'blob',
    });

    return downloadBlob(response.data, filename);
  } catch (error) {
    console.error(`❌ Error downloading ${label} PDF:`, error);
    throw error;
  }
};

// ============================================================
// REPORT SERVICE
// ============================================================
export const reportService = {
  // ============================================================
  // TRIPS / LOADS / FUEL — HTML
  // ============================================================

  generateTripReport: async (tripNumber) =>
    generateHtmlReport(
      `/reports/trip/${encodeURIComponent(tripNumber)}`,
      {},
      `trip report (${tripNumber})`
    ),

  generateLoadReport: async (loadNumber) =>
    generateHtmlReport(
      `/reports/load/${encodeURIComponent(loadNumber)}`,
      {},
      `load report (${loadNumber})`
    ),

  generateFuelReport: async (vehicleId, startDate, endDate) => {
    const params = {};
    if (vehicleId) params.vehicleId = vehicleId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return generateHtmlReport('/reports/fuel', params, 'fuel report');
  },


// ============================================================
// ANALYTICS — PIVOT
// ============================================================

generatePivotReport: async (params = {}) =>
  generateHtmlReport('/reports/analytics/pivot', params, 'pivot report'),

downloadPivotReportPDF: async (params = {}) =>
  downloadPdfReport(
    '/reports/analytics/pivot/pdf',
    params,
    `pivot-${params.entity || 'report'}-${params.groupBy || 'group'}${
      params.pivotBy ? '-by-' + params.pivotBy : ''
    }.pdf`,
    'pivot report'
  ),
  // ============================================================
  // TRIPS / LOADS / FUEL — PDF
  // ============================================================

  downloadTripReportPDF: async (tripNumber) =>
    downloadPdfReport(
      `/reports/trip/${encodeURIComponent(tripNumber)}/pdf`,
      {},
      `trip-report-${tripNumber}.pdf`,
      `trip report (${tripNumber})`
    ),

  downloadLoadReportPDF: async (loadNumber) =>
    downloadPdfReport(
      `/reports/load/${encodeURIComponent(loadNumber)}/pdf`,
      {},
      `load-report-${loadNumber}.pdf`,
      `load report (${loadNumber})`
    ),

  downloadFuelReportPDF: async (vehicleId, startDate, endDate) => {
    const params = {};
    if (vehicleId) params.vehicleId = vehicleId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return downloadPdfReport(
      '/reports/fuel/pdf',
      params,
      `fuel-report-${vehicleId || 'all'}.pdf`,
      'fuel report'
    );
  },

  // ============================================================
  // INVENTORY — HTML
  // ============================================================

  generateStockOnHandReport: async (params = {}) =>
    generateHtmlReport('/reports/inventory/stock-on-hand', params, 'stock on hand report'),

  generateLowStockReport: async (params = {}) =>
    generateHtmlReport('/reports/inventory/low-stock', params, 'low stock report'),

  generateInventoryMovementsReport: async (params = {}) =>
    generateHtmlReport('/reports/inventory/movements', params, 'inventory movements report'),

  generateStockValuationReport: async (params = {}) =>
    generateHtmlReport('/reports/inventory/valuation', params, 'stock valuation report'),

  generateInventoryIssuesReport: async (params = {}) =>
    generateHtmlReport('/reports/inventory/issues', params, 'inventory issues report'),

  generateInventoryItemReport: async (itemId, params = {}) =>
    generateHtmlReport(
      `/reports/inventory/item/${encodeURIComponent(itemId)}`,
      params,
      `inventory item report (${itemId})`
    ),

  // ============================================================
  // INVENTORY — PDF
  // ============================================================

  downloadStockOnHandReportPDF: async (params = {}) =>
    downloadPdfReport(
      '/reports/inventory/stock-on-hand/pdf',
      params,
      `stock-on-hand${params?.locationId ? `-loc-${params.locationId}` : ''}.pdf`,
      'stock on hand report'
    ),

  downloadLowStockReportPDF: async (params = {}) =>
    downloadPdfReport(
      '/reports/inventory/low-stock/pdf',
      params,
      `low-stock${params?.locationId ? `-loc-${params.locationId}` : ''}.pdf`,
      'low stock report'
    ),

  downloadInventoryMovementsReportPDF: async (params = {}) =>
    downloadPdfReport(
      '/reports/inventory/movements/pdf',
      params,
      'inventory-movements.pdf',
      'inventory movements report'
    ),

  downloadStockValuationReportPDF: async (params = {}) =>
    downloadPdfReport(
      '/reports/inventory/valuation/pdf',
      params,
      `stock-valuation${params?.groupBy ? `-by-${params.groupBy}` : ''}.pdf`,
      'stock valuation report'
    ),

  downloadInventoryIssuesReportPDF: async (params = {}) =>
    downloadPdfReport(
      '/reports/inventory/issues/pdf',
      params,
      `inventory-issues${params?.issueType ? `-${params.issueType}` : ''}.pdf`,
      'inventory issues report'
    ),

  downloadInventoryItemReportPDF: async (itemId, params = {}) =>
    downloadPdfReport(
      `/reports/inventory/item/${encodeURIComponent(itemId)}/pdf`,
      params,
      `inventory-item-${itemId}.pdf`,
      `inventory item report (${itemId})`
    ),
};

export default reportService;
