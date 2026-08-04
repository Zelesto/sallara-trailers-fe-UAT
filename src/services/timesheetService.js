// src/services/timesheetService.js
import api from './api';

const toSnakeCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    driverId: 'driver_id',
    entryDate: 'entry_date',
    startTime: 'start_time',
    endTime: 'end_time',
    breakDuration: 'break_duration',
    totalHours: 'total_hours',
    activityType: 'activity_type',
    punchStatus: 'punch_status',
    punchLocation: 'punch_location',
    punchLatitude: 'punch_latitude',
    punchLongitude: 'punch_longitude',
    clockInTime: 'clock_in_time',
    clockOutTime: 'clock_out_time',
    breakStartTime: 'break_start_time',
    breakEndTime: 'break_end_time',
    isActive: 'is_active',
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
    entry_date: 'entryDate',
    start_time: 'startTime',
    end_time: 'endTime',
    break_duration: 'breakDuration',
    total_hours: 'totalHours',
    activity_type: 'activityType',
    punch_status: 'punchStatus',
    punch_location: 'punchLocation',
    punch_latitude: 'punchLatitude',
    punch_longitude: 'punchLongitude',
    clock_in_time: 'clockInTime',
    clock_out_time: 'clockOutTime',
    break_start_time: 'breakStartTime',
    break_end_time: 'breakEndTime',
    is_active: 'isActive',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

export const timesheetService = {
  // ====== PUNCH OPERATIONS ======
  
  punch: async (punchData) => {
    try {
      const payload = toSnakeCase(punchData);
      const response = await api.post('/timesheet/punch', payload);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error processing punch:', error);
      throw error;
    }
  },

  getActivePunch: async (driverId) => {
    try {
      const response = await api.get(`/timesheet/driver/${driverId}/active`);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error fetching active punch:', error);
      throw error;
    }
  },

  // ====== TIMESHEET ENTRIES ======
  
  getEntries: async (driverId, startDate, endDate) => {
    try {
      const response = await api.get(`/timesheet/driver/${driverId}`, {
        params: { startDate, endDate }
      });
      if (Array.isArray(response)) {
        return response.map(entry => toCamelCase(entry));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      throw error;
    }
  },

  getTotalHours: async (driverId, startDate, endDate) => {
    try {
      const response = await api.get(`/timesheet/driver/${driverId}/hours`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('Error fetching total hours:', error);
      throw error;
    }
  },

  // ====== TIMESHEET SUMMARY ======
  
  getSummary: async (driverId, startDate, endDate) => {
    try {
      const response = await api.get(`/timesheet/driver/${driverId}/summary`, {
        params: { startDate, endDate }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error fetching timesheet summary:', error);
      throw error;
    }
  },

  // ====== TIMESHEET APPROVALS ======
  
  submitTimesheet: async (timesheetId) => {
    try {
      const response = await api.put(`/timesheet/${timesheetId}/submit`);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      throw error;
    }
  },

  approveTimesheet: async (timesheetId, approverId) => {
    try {
      const response = await api.put(`/timesheet/${timesheetId}/approve`, null, {
        params: { approverId }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error approving timesheet:', error);
      throw error;
    }
  },

  rejectTimesheet: async (timesheetId, reason) => {
    try {
      const response = await api.put(`/timesheet/${timesheetId}/reject`, null, {
        params: { reason }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      throw error;
    }
  },
};

export default timesheetService;
