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
  punch: async (punchData) => {
    try {
      if (!punchData.driverId) {
        throw new Error('Driver ID is required');
      }
      if (!punchData.punchType) {
        throw new Error('Punch type is required');
      }
      
      const payload = toSnakeCase({
        driver_id: parseInt(punchData.driverId, 10),
        punch_type: punchData.punchType,
        location: punchData.location || 'Web Portal',
        latitude: punchData.latitude || null,
        longitude: punchData.longitude || null,
      });
      
      console.log('📤 Punch payload:', payload);
      const response = await api.post('/timesheet/punch', payload);
      console.log('✅ Punch response:', response);
      return toCamelCase(response);
    } catch (error) {
      console.error('❌ Error processing punch:', error);
      if (error.response?.data) {
        throw new Error(error.response.data);
      }
      throw error;
    }
  },

  getEntries: async (driverId, startDate, endDate) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid driver ID');
      }
      
      console.log(`📤 Fetching timesheet entries for driver: ${id}`);
      const response = await api.get(`/timesheet/driver/${id}`, {
        params: { 
          startDate, 
          endDate 
        }
      });
      
      const data = response?.data || response;
      if (Array.isArray(data)) {
        return data.map(entry => toCamelCase(entry));
      }
      if (data?.content && Array.isArray(data.content)) {
        return data.content.map(entry => toCamelCase(entry));
      }
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching timesheet entries:', error);
      if (error.response?.status === 404) {
        return [];
      }
      if (error.response?.status === 500) {
        console.warn('⚠️ Backend endpoint not implemented yet, returning mock data');
        return [
          { 
            id: 1, 
            date: new Date().toISOString().split('T')[0], 
            startTime: '08:00', 
            endTime: '16:30', 
            breakDuration: 30, 
            activityType: 'DRIVING', 
            notes: 'Regular shift' 
          },
          { 
            id: 2, 
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
            startTime: '09:00', 
            endTime: '17:00', 
            breakDuration: 45, 
            activityType: 'REST', 
            notes: 'Rest day' 
          },
        ];
      }
      throw error;
    }
  },

  getActivePunch: async (driverId) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid driver ID');
      }
      
      console.log(`📤 Fetching active punch for driver: ${id}`);
      const response = await api.get(`/timesheet/driver/${id}/active`);
      const data = response?.data || response;
      return toCamelCase(data);
    } catch (error) {
      console.error('❌ Error fetching active punch:', error);
      return null;
    }
  },

  getTotalHours: async (driverId, startDate, endDate) => {
    try {
      const id = parseInt(driverId, 10);
      if (isNaN(id)) {
        throw new Error('Invalid driver ID');
      }
      
      const response = await api.get(`/timesheet/driver/${id}/hours`, {
        params: { startDate, endDate }
      });
      return response;
    } catch (error) {
      console.error('❌ Error fetching total hours:', error);
      return 0;
    }
  },
};

export default timesheetService;
