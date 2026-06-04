import api from './api';

export const fuelService = {
  /* -------------------------
     1. Fuel Slips
     ------------------------- */

  // Fetch all slips, optional filters: accountId, startDate, endDate, finalized
  getFuelSlips: async (filters = {}) => {
    try {
      console.log('🔧 fuelService.getFuelSlips called with filters:', filters);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/fuel/slips?${queryString}` : '/api/fuel/slips';
      console.log('🌐 Making API call to:', url);

      // FIX: api.get() now returns just the data (from the interceptor)
      const data = await api.get(url); // ✅ No need for .data
      console.log('✅ API Response received:', data);

      // FIX: Return the data directly
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching fuel slips:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Fetch a single fuel slip by ID
  getFuelSlipById: async (id) => {
    try {
      const response = await api.get(`/fuel/slips/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching fuel slip ${id}:`, error);
      throw error;
    }
  },

  // Create a new fuel slip - UPDATED
  // In fuelService.js - Update the createFuelSlip function
  createFuelSlip: async (fuelSlipData) => {
    try {
      console.log('Creating fuel slip with data:', fuelSlipData);

       // ENHANCED PAYLOAD - include all fields your backend expects
          const payload = {
            slipNumber: fuelSlipData.slipNumber,
            transactionDate: fuelSlipData.transactionDate,
            vehicleRegistration: fuelSlipData.vehicleRegistration,
            driverName: fuelSlipData.driverName,
            fuelType: fuelSlipData.fuelType,
            quantity: parseFloat(fuelSlipData.quantity),
            unitPrice: parseFloat(fuelSlipData.unitPrice),
            stationName: fuelSlipData.stationName || 'Unknown Station',
            location: fuelSlipData.location || 'Unknown Location',
            paymentMethod: fuelSlipData.paymentMethod || 'Cash',
            // ADD THESE IMPORTANT FIELDS:
            tripId: fuelSlipData.tripId || null,
            odometerReading: fuelSlipData.odometerReading ? parseFloat(fuelSlipData.odometerReading) : null,
            // Optional fields:
            pumpNumber: fuelSlipData.pumpNumber || null,
            receiptNumber: fuelSlipData.receiptNumber || null,
            notes: fuelSlipData.notes || null,
            // If you have these IDs, send them too:
            vehicleId: fuelSlipData.vehicleId || null,
            driverId: fuelSlipData.driverId || null
          };
      console.log('Sending MINIMAL payload to API:', payload);

      const response = await api.post('/fuel/slips', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating fuel slip:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Finalize a fuel slip (mark as processed/closed)
  finalizeFuelSlip: async (id) => {
    try {
      await api.post(`/fuel/slips/${id}/finalize`);
    } catch (error) {
      console.error(`Error finalizing fuel slip ${id}:`, error);
      throw error;
    }
  },

  /* -------------------------
     2. Reconciliation
     ------------------------- */

  // Get reconciliation report for a date range
  getReconciliationReport: async (startDate, endDate, accountId) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (accountId) params.append('accountId', accountId);

      const queryString = params.toString();
      const url = queryString ? `/fuel/reconciliation?${queryString}` : '/api/fuel/reconciliation';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching reconciliation report:', error);
      throw error;
    }
  },

  // Get active trips for dropdown
  getActiveTrips: async () => {
    try {
      const response = await api.get('/fuel/slips/active-trips');
      return response.data;
    } catch (error) {
      console.error('Error fetching active trips:', error);
      throw error;
    }
  },

  // Get trip details for auto-population
  getTripDetails: async (tripId) => {
    try {
      const response = await api.get(`/fuel/slips/trip/${tripId}/details`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trip ${tripId} details:`, error);
      throw error;
    }
  },

  /* -------------------------
     3. Optional: Analytics
     ------------------------- */

  getFuelConsumption: async (vehicleId, period = 'month') => {
    try {
      const params = new URLSearchParams();
      if (vehicleId) params.append('vehicleId', vehicleId);
      params.append('period', period);

      const response = await api.get(`/fuel/consumption?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel consumption:', error);
      throw error;
    }
  },

  getFuelFraudAlerts: async () => {
    try {
      const response = await api.get('/fuel/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching fuel fraud alerts:', error);
      throw error;
    }
  }
};
