// src/services/billingService.js
import api from './api';

const billingService = {
  // Get loads with billings
  getLoadsWithBillings: async () => {
    try {
      const response = await api.get('/billing/loads/billable');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching loads with billings:', error);
      return [];
    }
  },

  // Get load billing summary
  getLoadBillingSummary: async (loadId) => {
    try {
      const response = await api.get(`/billing/loads/${loadId}/summary`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching billing summary for load ${loadId}:`, error);
      return null;
    }
  },

  // Generate invoice from load
  generateInvoiceFromLoad: async (loadId) => {
    try {
      const response = await api.post(`/billing/loads/${loadId}/generate-invoice`);
      return response.data;
    } catch (error) {
      console.error(`Error generating invoice from load ${loadId}:`, error);
      throw error;
    }
  },

  // Get trip billing
  getTripBilling: async (tripId) => {
    try {
      const response = await api.get(`/billing/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trip billing for ${tripId}:`, error);
      return null;
    }
  },

  // Calculate trip billing
  calculateTripBilling: async (tripId) => {
    try {
      const response = await api.post(`/billing/trips/${tripId}/calculate`);
      return response.data;
    } catch (error) {
      console.error(`Error calculating trip billing for ${tripId}:`, error);
      throw error;
    }
  },
};

export default billingService;
