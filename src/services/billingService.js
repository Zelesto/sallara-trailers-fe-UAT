// src/services/billingService.js
import api from './api';

const billingService = {
  // Get loads with billings
  getLoadsWithBillings: async () => {
    try {
      const response = await api.get('/billing/loads/billable');
      console.log('📦 Raw billable loads response:', response);
      
      // Handle different response formats
      let loadsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          loadsData = response.data;
        } else if (response.data.content) {
          loadsData = response.data.content;
        } else if (response.data.data) {
          loadsData = response.data.data;
        }
      } else if (Array.isArray(response)) {
        loadsData = response;
      }
      
      console.log('📦 Processed loads data:', loadsData);
      return loadsData;
    } catch (error) {
      console.error('❌ Error fetching loads with billings:', error);
      return [];
    }
  },

  // Get load billing summary
  getLoadBillingSummary: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}/summary`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching billing summary for load ${loadId}:`, error);
      return null;
    }
  },

  // Get load billing
  getLoadBilling: async (loadId) => {
    try {
      const response = await api.get(`/billing/load/${loadId}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching billing for load ${loadId}:`, error);
      return null;
    }
  },

  // Calculate load billing
  calculateLoadBilling: async (loadId, userId) => {
    try {
      const response = await api.post(`/billing/load/${loadId}/calculate?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating billing for load ${loadId}:`, error);
      throw error;
    }
  },

  // Generate invoice from load
  generateInvoiceFromLoad: async (loadId, userId) => {
    try {
      const response = await api.post(`/billing/load/${loadId}/invoice?userId=${userId || 1}`);
      return response.data;
    } catch (error) {
      console.error(`Error generating invoice from load ${loadId}:`, error);
      throw error;
    }
  },

  // Get trip billing
  getTripBilling: async (tripId) => {
    try {
      const response = await api.get(`/billing/trip/${tripId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trip billing for ${tripId}:`, error);
      return null;
    }
  },

  // Calculate trip billing
  calculateTripBilling: async (tripId, userId) => {
    try {
      const response = await api.post(`/billing/trip/${tripId}/calculate?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },

  // Bulk generate invoices
  bulkGenerateInvoices: async (loadIds, userId) => {
    try {
      const response = await api.post(`/billing/load/bulk-invoice?userId=${userId || 1}`, loadIds);
      return response.data;
    } catch (error) {
      console.error('Error bulk generating invoices:', error);
      throw error;
    }
  },
};

export default billingService;
