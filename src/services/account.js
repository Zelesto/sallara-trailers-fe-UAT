// src/services/account.js
import api from './api';

const accountService = {
  // Get all accounts
  getAllAccounts: async () => {
    try {
      const response = await api.get('/api/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Get account by ID
  getAccountById: async (id) => {
    try {
      const response = await api.get(`/api/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error);
      throw error;
    }
  },

  // Create new account
  createAccount: async (accountData) => {
    try {
      const response = await api.post('/api/accounts', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(`/api/accounts/${id}`, accountData);
      return response.data;
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      await api.delete(`/api/accounts/${id}`);
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      throw error;
    }
  },
async getAccountsByType(type) {
    try {
      const response = await api.get(`/api/accounts?type=${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} accounts:`, error);
      throw error;
    }
  },

  async getFuelAccounts() {
      return this.getAccountsByType('FUEL');
    },
  // Get account statements
  getAccountStatements: async (accountId) => {
    try {
      const response = await api.get(`/api/accounts/${accountId}/statements`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching statements for account ${accountId}:`, error);
      throw error;
    }
  },

  // Get account reconciliations
  getAccountReconciliations: async (accountId) => {
    try {
      const response = await api.get(`/api/accounts/${accountId}/reconciliations`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching reconciliations for account ${accountId}:`, error);
      throw error;
    }
  },
};

export default accountService;