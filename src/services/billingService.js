// src/services/billingService.js
import api from './api';

const billingService = {
  // ========== TRIP BILLING ==========
  getTripBilling: async (tripId) => {
    const response = await api.get(`/billing/trip/${tripId}`);
    return response.data;
  },

  calculateTripBilling: async (tripId) => {
    const response = await api.post(`/billing/trip/${tripId}/calculate`);
    return response.data;
  },

  // ========== LOAD BILLING ==========
  getLoadBilling: async (loadId) => {
    const response = await api.get(`/billing/load/${loadId}`);
    return response.data;
  },

  // ========== LOAD BILLING ==========
getLoadsWithBillings: async () => {
  try {
    const response = await api.get('/billing/loads/billable');
    return response.data;
  } catch (error) {
    console.error('Error fetching loads with billings:', error);
    // Return empty array instead of throwing
    return [];
  }
},
  
  getLoadBillingSummary: async (loadId) => {
    const response = await api.get(`/billing/load/${loadId}/summary`);
    return response.data;
  },

  calculateLoadBilling: async (loadId) => {
    const response = await api.post(`/billing/load/${loadId}/calculate`);
    return response.data;
  },

  recalculateLoadBilling: async (loadId) => {
    const response = await api.post(`/billing/load/${loadId}/recalculate`);
    return response.data;
  },

  // ========== INVOICE GENERATION ==========
  generateInvoiceFromLoad: async (loadId) => {
    const response = await api.post(`/billing/load/${loadId}/invoice`);
    return response.data;
  },

  generateInvoiceFromTrip: async (tripId) => {
    const response = await api.post(`/billing/trip/${tripId}/invoice`);
    return response.data;
  },

  // ========== BULK OPERATIONS ==========
  bulkGenerateInvoices: async (loadIds) => {
    const response = await api.post('/billing/load/bulk-invoice', loadIds);
    return response.data;
  },
};

export default billingService;
