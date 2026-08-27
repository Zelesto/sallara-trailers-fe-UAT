// src/services/reportService.js

import api from './api';

export const reportService = {
  generateTripReport: async (tripNumber) => {
    const response = await api.post(`/reports/trip/${tripNumber}`, null, {
      params: { format: 'html' },
      responseType: 'text',
    });
    return response.data;
  },

  generateLoadReport: async (loadNumber) => {
    const response = await api.post(`/reports/load/${loadNumber}`, null, {
      params: { format: 'html' },
      responseType: 'text',
    });
    return response.data;
  },

  generateFuelReport: async (vehicleId, startDate, endDate) => {
    const response = await api.post('/reports/fuel', null, {
      params: { vehicleId, startDate, endDate, format: 'html' },
      responseType: 'text',
    });
    return response.data;
  },
};

export default reportService;
