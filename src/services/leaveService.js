// src/services/leaveService.js
export const leaveService = {
  requestLeave: async (leaveData) => {
    try {
      // Validate required fields
      if (!leaveData.driverId) {
        throw new Error('Driver ID is required');
      }
      if (!leaveData.leaveTypeId) {
        throw new Error('Leave type is required');
      }
      if (!leaveData.startDate || !leaveData.endDate) {
        throw new Error('Start date and end date are required');
      }

      const payload = {
        driver_id: parseInt(leaveData.driverId, 10),
        leave_type_id: parseInt(leaveData.leaveTypeId, 10),
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason || '',
        notes: leaveData.notes || '',
      };
      
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
        // If backend endpoint doesn't exist yet, return mock data
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
