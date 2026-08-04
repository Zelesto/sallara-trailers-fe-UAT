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
    // Leave Type
    leave_type: 'leaveType',
    // Leave Balance
    leave_type_id: 'leaveTypeId',
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
  // ====== LEAVE TYPES ======
  
  getLeaveTypes: async () => {
    try {
      const response = await api.get('/leave/types');
      if (Array.isArray(response)) {
        return response.map(type => toCamelCase(type));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching leave types:', error);
      throw error;
    }
  },

  // ====== LEAVE REQUESTS ======
  
  requestLeave: async (leaveData) => {
    try {
      const payload = toSnakeCase(leaveData);
      const response = await api.post('/leave/request', payload);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error requesting leave:', error);
      throw error;
    }
  },

  approveLeave: async (leaveId, approverId) => {
    try {
      const response = await api.put(`/leave/${leaveId}/approve`, null, {
        params: { approverId }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error approving leave:', error);
      throw error;
    }
  },

  rejectLeave: async (leaveId, reason) => {
    try {
      const response = await api.put(`/leave/${leaveId}/reject`, null, {
        params: { reason }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error rejecting leave:', error);
      throw error;
    }
  },

  cancelLeave: async (leaveId) => {
    try {
      const response = await api.put(`/leave/${leaveId}/cancel`);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error cancelling leave:', error);
      throw error;
    }
  },

  getLeaveRequests: async (driverId) => {
    try {
      const response = await api.get(`/leave/driver/${driverId}`);
      if (Array.isArray(response)) {
        return response.map(leave => toCamelCase(leave));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      throw error;
    }
  },

  getLeaveRequest: async (leaveId) => {
    try {
      const response = await api.get(`/leave/${leaveId}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching leave request ${leaveId}:`, error);
      throw error;
    }
  },

  // ====== LEAVE BALANCES ======
  
  getLeaveBalances: async (driverId) => {
    try {
      const response = await api.get(`/leave/driver/${driverId}/balances`);
      if (Array.isArray(response)) {
        return response.map(balance => toCamelCase(balance));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      throw error;
    }
  },

  getLeaveBalance: async (driverId, leaveTypeId, year) => {
    try {
      const response = await api.get(`/leave/driver/${driverId}/balance`, {
        params: { leaveTypeId, year }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      throw error;
    }
  },

  // ====== LEAVE SUMMARY ======
  
  getLeaveSummary: async (driverId) => {
    try {
      const response = await api.get(`/leave/driver/${driverId}/summary`);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error fetching leave summary:', error);
      throw error;
    }
  },

  getTeamLeaveCalendar: async (startDate, endDate) => {
    try {
      const response = await api.get('/leave/calendar', {
        params: { startDate, endDate }
      });
      if (Array.isArray(response)) {
        return response.map(leave => toCamelCase(leave));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching team leave calendar:', error);
      throw error;
    }
  },
};

export default leaveService;
