// src/services/expense.js
import api from './api';

const expenseService = {
  // Get all expenses
  getAllExpenses: async () => {
    try {
      const response = await api.get('/api/expenses');
      return response;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get expense by ID
  getExpenseById: async (id) => {
    try {
      const response = await api.get(`/api/expenses/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching expense ${id}:`, error);
      throw error;
    }
  },

  // Create new expense
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/api/expenses', expenseData);
      return response;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  updateExpense: async (id, expenseData) => {
    try {
      const response = await api.put(`/api/expenses/${id}`, expenseData);
      return response;
    } catch (error) {
      console.error(`Error updating expense ${id}:`, error);
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (id) => {
    try {
      await api.delete(`/api/expenses/${id}`);
    } catch (error) {
      console.error(`Error deleting expense ${id}:`, error);
      throw error;
    }
  },

  // Get expenses by category
  getExpensesByCategory: async (category) => {
    try {
      const response = await api.get(`/api/expenses/category/${category}`);
      return response;
    } catch (error) {
      console.error(`Error fetching expenses by category ${category}:`, error);
      throw error;
    }
  },

  // Get expenses by date range
  getExpensesByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/api/expenses/date-range`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      throw error;
    }
  },

  // Get expense summary
  getExpenseSummary: async () => {
    try {
      const response = await api.get('/api/expenses/summary');
      return response;
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      throw error;
    }
  },

  // Upload receipt
  uploadReceipt: async (expenseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/api/expenses/${expenseId}/receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      console.error(`Error uploading receipt for expense ${expenseId}:`, error);
      throw error;
    }
  }
};

export default expenseService;