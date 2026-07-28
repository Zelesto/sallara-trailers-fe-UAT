// src/services/vehicleIssueService.js
import api from './api';

export const vehicleIssueService = {
  // Get all vehicle issues
  getVehicleIssues: async (params = {}) => {
    try {
      const response = await api.get('/inventory/vehicle-issues', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle issues:', error);
      throw error;
    }
  },

  // Get vehicle issues by vehicle ID
  getVehicleIssuesByVehicle: async (vehicleId) => {
    try {
      const response = await api.get(`/inventory/vehicle-issues/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle issues for vehicle:', error);
      throw error;
    }
  },

  // Get vehicle issue by ID
  getVehicleIssueById: async (issueId) => {
    try {
      const response = await api.get(`/inventory/vehicle-issues/${issueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle issue:', error);
      throw error;
    }
  },

  // Create a new vehicle issue
  createVehicleIssue: async (data) => {
    try {
      const response = await api.post('/inventory/vehicle-issues', data);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle issue:', error);
      throw error;
    }
  },

  // Return items from vehicle
  returnItems: async (issueId, returnData) => {
    try {
      const response = await api.post(`/inventory/vehicle-issues/${issueId}/return`, returnData);
      return response.data;
    } catch (error) {
      console.error('Error returning items:', error);
      throw error;
    }
  },
};

export default vehicleIssueService;
