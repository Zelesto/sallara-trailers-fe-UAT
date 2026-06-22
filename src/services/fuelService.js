// src/services/fuelService.js
import api from './api';

export const fuelService = {
  /* -------------------------
     1. Fuel Slips
     ------------------------- */

  // Fetch all slips, optional filters: driverId, vehicleId, tripId, startDate, endDate, finalized
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
      const url = queryString ? `/fuel/slips?${queryString}` : '/fuel/slips';
      console.log('🌐 Making API call to:', url);

      const data = await api.get(url);
      console.log('✅ API Response received:', data);

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
      console.log(`🔧 Fetching fuel slip with ID: ${id}`);
      const data = await api.get(`/fuel/slips/${id}`);
      console.log('✅ Fuel slip details:', data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching fuel slip ${id}:`, error);
      throw error;
    }
  },

  // Create a new fuel slip
  createFuelSlip: async (fuelSlipData) => {
    try {
      console.log('🔧 Creating fuel slip with data:', fuelSlipData);

      const payload = {
        slipNumber: fuelSlipData.slipNumber,
        transactionDate: fuelSlipData.transactionDate,
        vehicleRegistration: fuelSlipData.vehicleRegistration,
        driverName: fuelSlipData.driverName,
        fuelType: fuelSlipData.fuelType || 'Diesel',
        quantity: parseFloat(fuelSlipData.quantity),
        unitPrice: parseFloat(fuelSlipData.unitPrice),
        totalAmount: parseFloat(fuelSlipData.quantity) * parseFloat(fuelSlipData.unitPrice),
        stationName: fuelSlipData.stationName || 'Unknown Station',
        location: fuelSlipData.location || 'Unknown Location',
        paymentMethod: fuelSlipData.paymentMethod || 'Cash',
        tripId: fuelSlipData.tripId || null,
        odometerReading: fuelSlipData.odometerReading ? parseFloat(fuelSlipData.odometerReading) : null,
        pumpNumber: fuelSlipData.pumpNumber || null,
        receiptNumber: fuelSlipData.receiptNumber || null,
        notes: fuelSlipData.notes || null,
        vehicleId: fuelSlipData.vehicleId || null,
        driverId: fuelSlipData.driverId || null,
        finalized: fuelSlipData.finalized || false,
      };

      console.log('📤 Sending payload to API:', payload);

      const data = await api.post('/fuel/slips', payload);
      console.log('✅ Fuel slip created:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating fuel slip:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update an existing fuel slip
  updateFuelSlip: async (id, fuelSlipData) => {
    try {
      console.log(`🔧 Updating fuel slip ${id} with data:`, fuelSlipData);

      const payload = {
        slipNumber: fuelSlipData.slipNumber,
        transactionDate: fuelSlipData.transactionDate,
        vehicleRegistration: fuelSlipData.vehicleRegistration,
        driverName: fuelSlipData.driverName,
        fuelType: fuelSlipData.fuelType || 'Diesel',
        quantity: parseFloat(fuelSlipData.quantity),
        unitPrice: parseFloat(fuelSlipData.unitPrice),
        totalAmount: parseFloat(fuelSlipData.quantity) * parseFloat(fuelSlipData.unitPrice),
        stationName: fuelSlipData.stationName || 'Unknown Station',
        location: fuelSlipData.location || 'Unknown Location',
        paymentMethod: fuelSlipData.paymentMethod || 'Cash',
        tripId: fuelSlipData.tripId || null,
        odometerReading: fuelSlipData.odometerReading ? parseFloat(fuelSlipData.odometerReading) : null,
        pumpNumber: fuelSlipData.pumpNumber || null,
        receiptNumber: fuelSlipData.receiptNumber || null,
        notes: fuelSlipData.notes || null,
        vehicleId: fuelSlipData.vehicleId || null,
        driverId: fuelSlipData.driverId || null,
        finalized: fuelSlipData.finalized || false,
      };

      console.log('📤 Sending update payload:', payload);

      const data = await api.put(`/fuel/slips/${id}`, payload);
      console.log('✅ Fuel slip updated:', data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating fuel slip ${id}:`, error);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a fuel slip
  deleteFuelSlip: async (id) => {
    try {
      console.log(`🔧 Deleting fuel slip ${id}`);
      await api.delete(`/fuel/slips/${id}`);
      console.log('✅ Fuel slip deleted');
    } catch (error) {
      console.error(`❌ Error deleting fuel slip ${id}:`, error);
      throw error;
    }
  },

  // Finalize a fuel slip (mark as processed/closed)
  finalizeFuelSlip: async (id) => {
    try {
      console.log(`🔧 Finalizing fuel slip ${id}`);
      const data = await api.patch(`/fuel/slips/${id}/finalize`);
      console.log('✅ Fuel slip finalized:', data);
      return data;
    } catch (error) {
      console.error(`❌ Error finalizing fuel slip ${id}:`, error);
      throw error;
    }
  },

  // Get fuel slip statistics
  getFuelSlipStats: async (filters = {}) => {
    try {
      console.log('🔧 Getting fuel slip stats with filters:', filters);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/fuel/slips/stats?${queryString}` : '/fuel/slips/stats';
      
      const data = await api.get(url);
      console.log('✅ Fuel slip stats:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching fuel slip stats:', error);
      throw error;
    }
  },

  /* -------------------------
     2. Reconciliation
     ------------------------- */

  // Get reconciliation report for a date range
  getReconciliationReport: async (startDate, endDate, accountId) => {
    try {
      console.log('🔧 Getting reconciliation report:', { startDate, endDate, accountId });

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (accountId) params.append('accountId', accountId);

      const queryString = params.toString();
      const url = queryString ? `/fuel/reconciliation?${queryString}` : '/fuel/reconciliation';

      const data = await api.get(url);
      console.log('✅ Reconciliation report:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching reconciliation report:', error);
      throw error;
    }
  },

  // Get active trips for dropdown
  getActiveTrips: async () => {
    try {
      console.log('🔧 Fetching active trips');
      const data = await api.get('/fuel/slips/active-trips');
      console.log('✅ Active trips:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching active trips:', error);
      throw error;
    }
  },

  // Get trip details for auto-population
  getTripDetails: async (tripId) => {
    try {
      console.log(`🔧 Fetching trip details for ID: ${tripId}`);
      const data = await api.get(`/fuel/slips/trip/${tripId}/details`);
      console.log('✅ Trip details:', data);
      return data;
    } catch (error) {
      console.error(`❌ Error fetching trip ${tripId} details:`, error);
      throw error;
    }
  },

  /* -------------------------
     3. Analytics
     ------------------------- */

  // Get fuel consumption data
  getFuelConsumption: async (vehicleId, period = 'month') => {
    try {
      console.log('🔧 Getting fuel consumption:', { vehicleId, period });

      const params = new URLSearchParams();
      if (vehicleId) params.append('vehicleId', vehicleId);
      params.append('period', period);

      const data = await api.get(`/fuel/consumption?${params.toString()}`);
      console.log('✅ Fuel consumption data:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching fuel consumption:', error);
      throw error;
    }
  },

  // Get fuel fraud alerts
  getFuelFraudAlerts: async () => {
    try {
      console.log('🔧 Fetching fuel fraud alerts');
      const data = await api.get('/fuel/alerts');
      console.log('✅ Fuel fraud alerts:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching fuel fraud alerts:', error);
      throw error;
    }
  },

  /* -------------------------
     4. Bulk Operations
     ------------------------- */

  // Bulk create fuel slips
  bulkCreateFuelSlips: async (fuelSlipsData) => {
    try {
      console.log('🔧 Bulk creating fuel slips:', fuelSlipsData.length);
      const data = await api.post('/fuel/slips/bulk', fuelSlipsData);
      console.log('✅ Bulk fuel slips created:', data);
      return data;
    } catch (error) {
      console.error('❌ Error bulk creating fuel slips:', error);
      throw error;
    }
  },

  // Bulk update fuel slips
  bulkUpdateFuelSlips: async (fuelSlipsData) => {
    try {
      console.log('🔧 Bulk updating fuel slips:', fuelSlipsData.length);
      const data = await api.put('/fuel/slips/bulk', fuelSlipsData);
      console.log('✅ Bulk fuel slips updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error bulk updating fuel slips:', error);
      throw error;
    }
  },

  // Bulk delete fuel slips
  bulkDeleteFuelSlips: async (ids) => {
    try {
      console.log('🔧 Bulk deleting fuel slips:', ids);
      const data = await api.delete('/fuel/slips/bulk', { data: { ids } });
      console.log('✅ Bulk fuel slips deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Error bulk deleting fuel slips:', error);
      throw error;
    }
  },

  /* -------------------------
     5. Export
     ------------------------- */

  // Export fuel slips to CSV
  exportFuelSlips: async (filters = {}) => {
    try {
      console.log('🔧 Exporting fuel slips with filters:', filters);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `/fuel/slips/export?${queryString}` : '/fuel/slips/export';
      
      // For file downloads, we need to handle the response differently
      const response = await api.get(url, { responseType: 'blob' });
      
      // Create a download link
      const blob = new Blob([response], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `fuel-slips-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      console.log('✅ Fuel slips exported successfully');
    } catch (error) {
      console.error('❌ Error exporting fuel slips:', error);
      throw error;
    }
  },
};

// Helper function to calculate total amount
export const calculateTotalAmount = (quantity, unitPrice) => {
  return parseFloat(quantity) * parseFloat(unitPrice);
};

// Helper function to format fuel slip data for display
export const formatFuelSlipForDisplay = (slip) => {
  return {
    ...slip,
    formattedTotal: new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(slip.totalAmount || 0),
    formattedUnitPrice: new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(slip.unitPrice || 0),
    formattedDate: slip.transactionDate 
      ? new Date(slip.transactionDate).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'N/A',
  };
};

export default fuelService;
