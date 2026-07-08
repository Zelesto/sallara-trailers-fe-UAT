// src/services/enumService.js
import api from './api';

export const enumService = {
  // Get all enums for a type (system + custom)
  getEnums: async (enumType, tenantId) => {
    const response = await api.get(`/api/enums/${enumType}`, {
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
    return response.data;
  },

  // Get paginated enums (admin)
  getEnumsPaginated: async (params = {}) => {
    const response = await api.get('/api/enums', { params });
    return response.data;
  },

  // Get all enum types
  getEnumTypes: async (tenantId) => {
    const response = await api.get('/api/enums/types', {
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
    return response.data;
  },

  // Add custom enum
  addCustomEnum: async (data, tenantId) => {
    const response = await api.post('/api/enums/custom', data, {
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
    return response.data;
  },

  // Update custom enum
  updateCustomEnum: async (id, data, tenantId) => {
    const response = await api.put(`/api/enums/custom/${id}`, data, {
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
    return response.data;
  },

  // Delete custom enum (soft delete)
  deleteCustomEnum: async (id, enumType, tenantId) => {
    await api.delete(`/api/enums/custom/${id}`, {
      params: { enumType },
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
  },

  // Toggle enum status
  toggleEnumStatus: async (id, enumType, tenantId) => {
    const response = await api.patch(`/api/enums/custom/${id}/toggle`, null, {
      params: { enumType },
      headers: tenantId ? { 'X-Tenant-Id': tenantId } : {}
    });
    return response.data;
  }
};
