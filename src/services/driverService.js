// src/services/driverService.js
import api from './api';

// Helper to convert camelCase to snake_case for backend
const toSnakeCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    firstName: 'first_name',
    lastName: 'last_name',
    licenseNumber: 'license_number',
    licenseExpiry: 'license_expiry',
    licenseType: 'license_type',
    phoneNumber: 'phone_number',
    hireDate: 'hire_date',
    employmentType: 'employment_type',
    shiftPattern: 'shift_pattern',
    assignedVehicleId: 'assigned_vehicle_id',
    trainingCompleted: 'training_completed',
    trainingCertificates: 'training_certificates',
    medicalClearanceDate: 'medical_clearance_date',
    nextMedicalDue: 'next_medical_due',
    incidentsLogged: 'incidents_logged',
    totalTrips: 'total_trips',
    totalKmTravelled: 'total_km_travelled',
    totalHoursActive: 'total_hours_active',
    performanceScore: 'performance_score',
    terminationDate: 'termination_date',
    terminationReason: 'termination_reason',
    isActive: 'is_active',
    appUserId: 'app_user_id'
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

// Helper to convert snake_case to camelCase for frontend
const toCamelCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    first_name: 'firstName',
    last_name: 'lastName',
    license_number: 'licenseNumber',
    license_expiry: 'licenseExpiry',
    license_type: 'licenseType',
    phone_number: 'phoneNumber',
    hire_date: 'hireDate',
    employment_type: 'employmentType',
    shift_pattern: 'shiftPattern',
    assigned_vehicle_id: 'assignedVehicleId',
    training_completed: 'trainingCompleted',
    training_certificates: 'trainingCertificates',
    medical_clearance_date: 'medicalClearanceDate',
    next_medical_due: 'nextMedicalDue',
    incidents_logged: 'incidentsLogged',
    total_trips: 'totalTrips',
    total_km_travelled: 'totalKmTravelled',
    total_hours_active: 'totalHoursActive',
    performance_score: 'performanceScore',
    termination_date: 'terminationDate',
    termination_reason: 'terminationReason',
    is_active: 'isActive',
    app_user_id: 'appUserId'
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

export const driverService = {
  /**
   * Get all drivers
   */
  getAllDrivers: async (params = {}) => {
    try {
      const response = await api.get('/drivers', { params });
      console.log('Driver Service Response:', response);
      
      if (Array.isArray(response)) {
        return response.map(driver => toCamelCase(driver));
      }
      if (response?.content) {
        return {
          ...response,
          content: response.content.map(driver => toCamelCase(driver))
        };
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by ID
   */
  getDriverById: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new driver
   */
  createDriver: async (driverData) => {
    try {
      console.log('🚗 Creating driver with data:', driverData);
      const payload = toSnakeCase(driverData);
      console.log('📤 Sending payload:', payload);
      
      const response = await api.post('/drivers', payload);
      console.log('✅ Driver created successfully:', response);
      return toCamelCase(response);
    } catch (error) {
      console.error('❌ Error creating driver:', error);
      throw error;
    }
  },

  /**
   * Update an existing driver
   */
  updateDriver: async (id, driverData) => {
    try {
      console.log(`🔄 Updating driver ${id}:`, driverData);
      const payload = toSnakeCase(driverData);
      console.log('📤 Sending payload:', payload);
      
      const response = await api.put(`/drivers/${id}`, payload);
      console.log('✅ Driver updated successfully:', response);
      return toCamelCase(response);
    } catch (error) {
      console.error(`❌ Error updating driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Patch/Partially update a driver
   */
  patchDriver: async (id, driverData) => {
    try {
      const payload = toSnakeCase(driverData);
      const response = await api.patch(`/drivers/${id}`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error patching driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a driver
   */
  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/drivers/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Search drivers
   */
  searchDrivers: async (searchTerm) => {
    try {
      const response = await api.get('/drivers/search', {
        params: { q: searchTerm }
      });
      if (Array.isArray(response)) {
        return response.map(driver => toCamelCase(driver));
      }
      return response || [];
    } catch (error) {
      console.error('Error searching drivers:', error);
      throw error;
    }
  },

  /**
   * Get drivers by status
   */
  getDriversByStatus: async (status) => {
    try {
      const response = await api.get(`/drivers/status/${status}`);
      if (Array.isArray(response)) {
        return response.map(driver => toCamelCase(driver));
      }
      return response || [];
    } catch (error) {
      console.error(`Error fetching drivers with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get available drivers
   */
  getAvailableDrivers: async () => {
    try {
      const response = await api.get('/drivers/available');
      if (Array.isArray(response)) {
        return response.map(driver => toCamelCase(driver));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  },

  /**
   * Get driver by license number
   */
  getDriverByLicense: async (licenseNumber) => {
    try {
      const response = await api.get(`/drivers/license/${licenseNumber}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching driver by license ${licenseNumber}:`, error);
      throw error;
    }
  },

  /**
   * Update driver status
   */
  updateDriverStatus: async (id, status) => {
    try {
      const response = await api.put(`/drivers/${id}/status/${status}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error updating driver status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver trip history
   */
  getDriverTripHistory: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/trips`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching trip history for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver statistics
   */
  getDriverStatistics: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}/statistics`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching statistics for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get driver performance metrics
   */
  getDriverPerformance: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/performance`, { params });
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching performance for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Verify driver license
   */
  verifyDriverLicense: async (id) => {
    try {
      const response = await api.post(`/drivers/${id}/verify-license`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error verifying license for driver ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get drivers with expiring licenses
   */
  getExpiringLicenses: async (daysThreshold = 30) => {
    try {
      const response = await api.get('/drivers/license-expiring', {
        params: { days: daysThreshold }
      });
      if (Array.isArray(response)) {
        return response.map(driver => toCamelCase(driver));
      }
      return response || [];
    } catch (error) {
      console.error('Error fetching expiring licenses:', error);
      throw error;
    }
  }
};

export default driverService;
