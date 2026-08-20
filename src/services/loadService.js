// src/services/loadService.js
import api from './api';

export const loadService = {
  // Get all loads with pagination
  getAllLoads: async (page = 0, size = 20, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', size);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/loads?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads:', error);
      throw error;
    }
  },

  // Get load by number
  getLoadByNumber: async (loadNumber) => {
    try {
      const response = await api.get(`/loads/number/${loadNumber}`);
      return response;
    } catch (error) {
      console.error('Error fetching load:', error);
      throw error;
    }
  },

  // Get load by ID
  getLoadById: async (id) => {
    try {
      const response = await api.get(`/loads/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching load:', error);
      throw error;
    }
  },

  // ✅ FIX: Create new load with correct DTO structure
  createLoad: async (loadData) => {
    try {
      // Build payload matching LoadRequestDTO
      const payload = {
        // Core fields
        referenceNumber: loadData.referenceNumber || null,
        description: loadData.description || 'Load created from trip',
        customerId: loadData.customerId || null,
        
        // Measurements
        weightKg: loadData.weightKg || null,
        volumeCubicM: loadData.volumeCubicM || null,
        palletCount: loadData.palletCount || null,
        
        // Dates
        loadingDate: loadData.loadingDate || null,
        unloadingDate: loadData.unloadingDate || null,
        
        // Status & Priority
        status: loadData.status || 'PENDING',
        priority: loadData.priority || 'NORMAL',
        
        // Commodity
        commodityType: loadData.commodityType || null,
        containerNumber: loadData.containerNumber || null,
        
        // Special Handling
        hazardousMaterial: loadData.hazardousMaterial || false,
        specialHandling: loadData.specialHandling || null,
        handlingInstructions: loadData.handlingInstructions || null,
        packagingType: loadData.packagingType || null,
        hazardClass: loadData.hazardClass || null,
        temperatureRequirements: loadData.temperatureRequirements || null,
        
        // Location
        originLocation: loadData.originLocation || null,
        destinationLocation: loadData.destinationLocation || null,
        
        // Financial
        estimatedValue: loadData.estimatedValue || null,
        actualValue: loadData.actualValue || null,
        
        // Insurance & Customs
        insurancePolicyNumber: loadData.insurancePolicyNumber || null,
        insuranceExpiry: loadData.insuranceExpiry || null,
        customsClearanceStatus: loadData.customsClearanceStatus || null,
        
        // Relationships
        warehouseId: loadData.warehouseId || null,
        supervisorId: loadData.supervisorId || null,
        
        // Trips to associate
        tripIds: loadData.tripIds || [],
      };

      // ✅ Remove null/undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined || payload[key] === '') {
          delete payload[key];
        }
      });

      // ✅ Remove empty arrays
      if (payload.tripIds && payload.tripIds.length === 0) {
        delete payload.tripIds;
      }

      console.log('📦 Creating load with payload:', payload);
      const response = await api.post('/loads', payload);
      console.log('✅ Load created:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating load:', error);
      throw error;
    }
  },

  // ✅ Search loads by reference number or other criteria
  searchLoads: async (params = {}) => {
    try {
      // Try the search endpoint
      const response = await api.get('/loads/search', { params });
      return response;
    } catch (error) {
      console.warn('Search endpoint failed, falling back to getAllLoads:', error);
      // Fallback: get all loads and filter client-side
      try {
        const allLoads = await api.get('/loads', { params: { size: 1000 } });
        const loads = allLoads?.content || allLoads || [];
        
        // Filter by reference number if provided
        if (params.referenceNumber) {
          const filtered = loads.filter(load => 
            load.referenceNumber === params.referenceNumber ||
            load.referenceNumber?.toLowerCase() === params.referenceNumber?.toLowerCase()
          );
          return { content: filtered, totalElements: filtered.length, totalPages: 1 };
        }
        
        return allLoads;
      } catch (fallbackError) {
        console.error('Fallback search failed:', fallbackError);
        return { content: [], totalElements: 0, totalPages: 0 };
      }
    }
  },

  // ✅ Add trip to load
  addTripToLoad: async (loadId, tripId) => {
    try {
      // First get the load to get the load number
      const load = await loadService.getLoadById(loadId);
      if (!load || !load.loadNumber) {
        throw new Error('Load not found');
      }
      
      const response = await api.post(`/loads/${load.loadNumber}/trips`, [tripId]);
      return response;
    } catch (error) {
      console.error(`Error adding trip ${tripId} to load ${loadId}:`, error);
      
      // Try alternative endpoint
      try {
        const response = await api.put(`/loads/${loadId}/trips/${tripId}`);
        return response;
      } catch (altError) {
        console.error('Alternative add trip endpoint also failed:', altError);
        throw altError;
      }
    }
  },

  // ✅ Add multiple trips to load
  addTripsToLoad: async (loadNumber, tripIds) => {
    try {
      const response = await api.post(`/loads/${loadNumber}/trips`, tripIds);
      return response;
    } catch (error) {
      console.error('Error adding trips to load:', error);
      throw error;
    }
  },

  // Update load
  updateLoad: async (id, loadData) => {
    try {
      const response = await api.put(`/loads/${id}`, loadData);
      return response;
    } catch (error) {
      console.error('Error updating load:', error);
      throw error;
    }
  },

  // Delete load
  deleteLoad: async (id) => {
    try {
      const response = await api.delete(`/loads/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting load:', error);
      throw error;
    }
  },

  // Get loads by customer
  getLoadsByCustomer: async (customerId) => {
    try {
      const response = await api.get(`/loads/customer/${customerId}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads by customer:', error);
      throw error;
    }
  },

  // Get loads by status
  getLoadsByStatus: async (status) => {
    try {
      const response = await api.get(`/loads/status/${status}`);
      return response;
    } catch (error) {
      console.error('Error fetching loads by status:', error);
      throw error;
    }
  },

  // Smart merge trips
  smartMergeTrips: async (customerId, plannedDate) => {
    try {
      const response = await api.post(`/loads/smart-merge?customerId=${customerId}&plannedDate=${plannedDate}`);
      return response;
    } catch (error) {
      console.error('Error merging trips:', error);
      throw error;
    }
  },

  // Find merge candidates
  findMergeCandidates: async (customerId, plannedDate) => {
    try {
      const response = await api.get(`/loads/merge-candidates?customerId=${customerId}&plannedDate=${plannedDate}`);
      return response;
    } catch (error) {
      console.error('Error finding merge candidates:', error);
      throw error;
    }
  },
};

export default loadService;
