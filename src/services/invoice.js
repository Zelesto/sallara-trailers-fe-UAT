// src/services/invoice.service.js
import api from './api';

const invoiceService = {
  // Get all invoices with pagination and filters
  getAllInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      console.log('📋 Invoice service response:', response);
      
      // Return the data in a consistent format
      return response.data;
    } catch (error) {
      console.error('❌ Invoice service error:', error);
      // Return empty array structure instead of throwing
      return { content: [], totalElements: 0, totalPages: 0 };
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  },

  // Create new invoice
  createInvoice: async (invoiceData) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    try {
      await api.delete(`/invoices/${id}`);
    } catch (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw error;
    }
  },

  // Mark invoice as paid
  markAsPaid: async (id) => {
    try {
      const response = await api.post(`/invoices/${id}/mark-as-paid`);
      return response.data;
    } catch (error) {
      console.error(`Error marking invoice ${id} as paid:`, error);
      throw error;
    }
  },

  // Send invoice email
  sendInvoiceEmail: async (id) => {
    try {
      const response = await api.post(`/invoices/${id}/send-email`);
      return response.data;
    } catch (error) {
      console.error(`Error sending invoice ${id} email:`, error);
      throw error;
    }
  },

  // Get invoice stats
  getInvoiceStats: async () => {
    try {
      const response = await api.get('/invoices/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      return {
        totalInvoices: 0,
        overdueCount: 0,
        totalPaid: 0,
        totalOutstanding: 0
      };
    }
  },

  // Get invoices by customer
  getInvoicesByCustomer: async (customerId) => {
    try {
      const response = await api.get(`/invoices/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching invoices for customer ${customerId}:`, error);
      return [];
    }
  },

  // Get overdue invoices
  getOverdueInvoices: async () => {
    try {
      const response = await api.get('/invoices/overdue');
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      return [];
    }
  },
};

export default invoiceService;
