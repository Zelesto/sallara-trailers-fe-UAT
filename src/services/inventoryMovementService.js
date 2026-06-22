// src/services/inventoryMovementService.js
import api from './api';

export const inventoryMovementService = {
  // Record a stock movement with approval tracking
  recordMovement: async (movementData) => {
    try {
      const payload = {
        itemId: movementData.itemId,
        quantity: movementData.quantity,
        movementType: movementData.movementType, // 'IN', 'OUT', 'ADJUSTMENT'
        reason: movementData.reason,
        notes: movementData.notes,
        referenceNumber: movementData.referenceNumber,
        referenceType: movementData.referenceType, // 'INVOICE', 'PURCHASE_ORDER', 'RETURN', 'ADJUSTMENT'
        requiresApproval: movementData.requiresApproval || false,
        approvedBy: movementData.approvedBy || null,
        approvedAt: movementData.approvedAt || null,
        approvalStatus: movementData.approvalStatus || 'PENDING', // 'PENDING', 'APPROVED', 'REJECTED'
        performedBy: movementData.performedBy,
        tripId: movementData.tripId || null,
        fuelSlipId: movementData.fuelSlipId || null,
      };
      
      const response = await api.post('/inventory/recordMovement', payload);
      return response;
    } catch (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
  },

  // Get movement history with filters
  getMovementHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.itemId) params.append('itemId', filters.itemId);
      if (filters.movementType) params.append('movementType', filters.movementType);
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.performedBy) params.append('performedBy', filters.performedBy);
      
      const queryString = params.toString();
      const url = queryString ? `/inventory/movements?${queryString}` : '/inventory/movements';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching movement history:', error);
      throw error;
    }
  },

  // Get movements by item
  getMovementsByItem: async (itemId, page = 0, size = 20) => {
    try {
      const response = await api.get(`/inventory/movements/item/${itemId}?page=${page}&size=${size}`);
      return response;
    } catch (error) {
      console.error('Error fetching movements by item:', error);
      throw error;
    }
  },

  // Get movements awaiting approval
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/inventory/movements/pending');
      return response;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },

  // Approve a movement
  approveMovement: async (movementId, approvedBy, notes = '') => {
    try {
      const response = await api.patch(`/inventory/movements/${movementId}/approve`, {
        approvedBy,
        notes
      });
      return response;
    } catch (error) {
      console.error('Error approving movement:', error);
      throw error;
    }
  },

  // Reject a movement
  rejectMovement: async (movementId, rejectedBy, reason) => {
    try {
      const response = await api.patch(`/inventory/movements/${movementId}/reject`, {
        rejectedBy,
        reason
      });
      return response;
    } catch (error) {
      console.error('Error rejecting movement:', error);
      throw error;
    }
  },

  // Get movement by ID
  getMovementById: async (id) => {
    try {
      const response = await api.get(`/inventory/movements/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching movement:', error);
      throw error;
    }
  },

  // Get movement statistics
  getMovementStats: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/inventory/movements/stats?${queryString}` : '/inventory/movements/stats';
      
      const response = await api.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching movement stats:', error);
      throw error;
    }
  }
};

export default inventoryMovementService;
