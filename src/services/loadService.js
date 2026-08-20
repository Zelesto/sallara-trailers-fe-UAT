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

  // ✅ FIX: Create new load with proper data structure
  createLoad: async (loadData) => {
    try {
      // Ensure required fields
      const payload = {
        customerId: loadData.customerId || null,
        description: loadData.description || 'Load created from trip',
        commodityType: loadData.commodityType || null,
        weightKg: loadData.weightKg || null,
        volumeCubicM: loadData.volumeCubicM || null,
        palletCount: loadData.palletCount || null,
        containerNumber: loadData.containerNumber || null,
        referenceNumber: loadData.referenceNumber || null,
        priority: loadData.priority || 'NORMAL',
        status: 'PENDING',
        loadingDate: loadData.loadingDate || null,
        unloadingDate: loadData.unloadingDate || null,
        originLocation: loadData.originLocation || null,
        destinationLocation: loadData.destinationLocation || null,
        tripIds: loadData.tripIds || [],
      };

      // Remove null/undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      console.log('📦 Creating load with payload:', payload);
      const response = await api.post('/loads', payload);
      return response;
    } catch (error) {
      console.error('Error creating load:', error);
      throw error;
    }
  },

  // ✅ FIX: Search loads by reference number or other criteria
  searchLoads: async (params = {}) => {
    try {
      // Try the search endpoint
      const response = await api.get('/loads/search', { params });
      return response;
    } catch (error) {
      console.warn('Search endpoint failed, falling back to getAllLoads:', error);
      // Fallback: get all loads and filter
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

  // ✅ FIX: Add trip to load (matches backend endpoint)
  addTripToLoad: async (loadId, tripId) => {
    try {
      // Try the endpoint from the controller: POST /loads/{loadNumber}/trips
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

  // ✅ FIX: Add multiple trips to load
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
