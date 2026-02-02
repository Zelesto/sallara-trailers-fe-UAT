// src/services/invoice.service.js
import api from './api';

const invoiceService = {
  // Get all invoices with optional filters
  getAllInvoices: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/invoices?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    try {
      const response = await api.get(`/api/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
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
      const response = await api.put(`/api/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    try {
      const response = await api.delete(`/api/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  },

  // Send invoice via email
  sendInvoiceEmail: async (id, emailData = {}) => {
    try {
      const response = await api.post(`/api/invoices/${id}/send-email`, emailData);
      return response.data;
    } catch (error) {
      console.error('Error sending invoice email:', error);
      throw error;
    }
  },

  // Mark invoice as paid
  markAsPaid: async (id, paymentData = {}) => {
    try {
      const response = await api.post(`/api/invoices/${id}/mark-as-paid`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  },

  // Record partial payment
  recordPartialPayment: async (id, paymentData) => {
    try {
      const response = await api.post(`/api/invoices/${id}/partial-payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Error recording partial payment:', error);
      throw error;
    }
  },

  // Download invoice PDF
  downloadInvoicePdf: async (id) => {
    try {
      const response = await api.get(`/api/invoices/${id}/download-pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      throw error;
    }
  },

  // Get invoice statistics
  getInvoiceStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/invoices/stats?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      throw error;
    }
  },

  // Get invoices by customer
  getInvoicesByCustomer: async (customerId, filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/invoices/customer/${customerId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }
  },

  // Get overdue invoices
  getOverdueInvoices: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/invoices/overdue?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      throw error;
    }
  },

  // Export invoices to Excel
  exportInvoices: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/invoices/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting invoices:', error);
      throw error;
    }
  },

  // Bulk update invoice status
  bulkUpdateStatus: async (invoiceIds, status) => {
    try {
      const response = await api.post('/invoices/bulk-update-status', {
        invoiceIds,
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating invoice status:', error);
      throw error;
    }
  }
};

export default invoiceService;