// src/services/account.js
import api, { unwrapApiResponse, unwrapSingleApiResponse } from './api';

const accountService = {
  // Get all accounts
  getAllAccounts: async () => {
    try {
      const response = await api.get('/accounts');
      return unwrapApiResponse(response, []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Get account by ID
  getAccountById: async (id) => {
    try {
      const response = await api.get(`/accounts/${id}`);
      return unwrapSingleApiResponse(response);
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error);
      throw error;
    }
  },

  // Create new account
  createAccount: async (accountData) => {
    try {
      const response = await api.post('/accounts', accountData);
      return unwrapSingleApiResponse(response);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(`/accounts/${id}`, accountData);
      return unwrapSingleApiResponse(response);
    } catch (error) {
      console.error(`Error updating account ${id}:`, error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      await api.delete(`/accounts/${id}`);
    } catch (error) {
      console.error(`Error deleting account ${id}:`, error);
      throw error;
    }
  },

  getAccountsByType: async (type) => {
    try {
      const response = await api.get(`/accounts?type=${type}`);
      return unwrapApiResponse(response, []);
    } catch (error) {
      console.error(`Error fetching ${type} accounts:`, error);
      throw error;
    }
  },

  getFuelAccounts: async () => {
    return accountService.getAccountsByType('FUEL');
  },
  // Get account statements
  getAccountStatements: async (accountId) => {
    try {
      const response = await api.get(`/accounts/${accountId}/statements`);
      return unwrapApiResponse(response, []);
    } catch (error) {
      console.error(`Error fetching statements for account ${accountId}:`, error);
      throw error;
    }
  },

  // Get account reconciliations
  getAccountReconciliations: async (accountId) => {
    try {
      const response = await api.get(`/accounts/${accountId}/reconciliations`);
      return unwrapApiResponse(response, []);
    } catch (error) {
      console.error(`Error fetching reconciliations for account ${accountId}:`, error);
      throw error;
    }
  },
};

export default accountService;
