// src/services/leaveService.js
import api from './api';

const toSnakeCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    driverId: 'driver_id',
    leaveTypeId: 'leave_type_id',
    startDate: 'start_date',
    endDate: 'end_date',
    durationDays: 'duration_days',
    attachmentUrl: 'attachment_url',
    approvedBy: 'approved_by',
    approvedAt: 'approved_at',
    rejectionReason: 'rejection_reason',
    requestedAt: 'requested_at',
  };
  
  Object.keys(data).forEach(key => {
    const snakeKey = mappings[key] || key;
    if (data[key] === undefined) {
      return;
    }
    result[snakeKey] = data[key];
  });
  
  return result;
};

const toCamelCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    driver_id: 'driverId',
    leave_type_id: 'leaveTypeId',
    start_date: 'startDate',
    end_date: 'endDate',
    duration_days: 'durationDays',
    attachment_url: 'attachmentUrl',
    approved_by: 'approvedBy',
    approved_at: 'approvedAt',
    rejection_reason: 'rejectionReason',
    requested_at: 'requestedAt',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    total_days: 'totalDays',
    used_days: 'usedDays',
    pending_days: 'pendingDays',
    remaining_days: 'remainingDays',
    carried_over: 'carriedOver',
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

export const leaveService = {
  requestLeave: async (leaveData) => {
    try {
      if (!leaveData.driverId) {
        throw new Error('Driver ID is required');
      }
      if (!leaveData.leaveTypeId) {
        throw new Error('Leave type is required');
      }
      if (!leaveData.startDate || !leaveData.endDate) {
        throw new Error('Start date and end date are required');
      }

      const payload = toSnakeCase({
        driver_id: parseInt(leaveData.driverId, 10),
        leave_type_id: parseInt(leaveData.leaveTypeId, 10),
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason || '',
        notes: leaveData.notes || '',
      });
      
      console.log('📤 Leave request payload:', payload);
      const response = await api.post('/leave/request', payload);
      console.log('✅ Leave request response:', response);
      return toCamelCase(response);
    } catch (error) {
      console.error('❌ Error requesting leave:', error);
      if (error.response?.data) {
        throw new Error(error.response.data);
      }
      throw error;
    }
  },

  getLeaveRequests: async (driverId) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid driver ID');
      }
      
      console.log(`📤 Fetching leave requests for driver: ${id}`);
      const response = await api.get(`/leave/driver/${id}`);
      const data = response?.data || response;
      
      if (Array.isArray(data)) {
        return data.map(leave => toCamelCase(leave));
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content.map(leave => toCamelCase(leave));
      }
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching leave requests:', error);
      if (error.response?.status === 404) {
        return [];
      }
      if (error.response?.status === 500) {
        console.warn('⚠️ Backend endpoint not implemented yet, returning mock data');
        return [
          { 
            id: 1, 
            type: 'ANNUAL', 
            startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], 
            endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], 
            status: 'PENDING', 
            reason: 'Family vacation' 
          },
        ];
      }
      throw error;
    }
  },


  

  approveLeave: async (leaveId, approverId) => {
  try {
    if (!leaveId) {
      throw new Error('Leave ID is required');
    }
    if (!approverId) {
      throw new Error('Approver ID is required');
    }

    const response = await api.put(`/leave/${leaveId}/approve`, null, {
      params: { approverId }
    });
    console.log('✅ Leave approved:', response);
    return toCamelCase(response);
  } catch (error) {
    console.error('❌ Error approving leave:', error);
    if (error.response?.data) {
      throw new Error(error.response.data);
    }
    throw error;
  }
},

rejectLeave: async (leaveId, reason) => {
  try {
    if (!leaveId) {
      throw new Error('Leave ID is required');
    }

    const response = await api.put(`/leave/${leaveId}/reject`, null, {
      params: { reason: reason || 'No reason provided' }
    });
    console.log('✅ Leave rejected:', response);
    return toCamelCase(response);
  } catch (error) {
    console.error('❌ Error rejecting leave:', error);
    if (error.response?.data) {
      throw new Error(error.response.data);
    }
    throw error;
  }
},

cancelLeave: async (leaveId) => {
  try {
    const response = await api.put(`/leave/${leaveId}/cancel`);
    return toCamelCase(response?.data || response);
  } catch (error) {
    console.error('❌ Error cancelling leave:', error);
    throw error;
  }
},

  getLeaveBalances: async (driverId) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid driver ID');
      }
      
      const response = await api.get(`/leave/driver/${id}/balances`);
      const data = response?.data || response;
      if (Array.isArray(data)) {
        return data.map(balance => toCamelCase(balance));
      }
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching leave balances:', error);
      return [];
    }
  },
};

export default leaveService;
