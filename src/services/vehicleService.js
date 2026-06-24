// src/services/vehicleService.js
import api from './api';

// Helper to validate enum values
const validateEnumValue = (key, value) => {
  // VehicleStatus enum values
  const validStatuses = [
    'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPAIR', 
    'SOLD', 'DECOMMISSIONED', 'AVAILABLE', 'ASSIGNED', 
    'IN_USE', 'OUT_OF_SERVICE', 'RETIRED'
  ];
  
  // VehicleType enum values
  const validTypes = ['TRUCK', 'TRAILER', 'VAN', 'CAR'];
  
  if (key === 'status') {
    return validStatuses.includes(value) ? value : 'AVAILABLE';
  }
  
  if (key === 'vehicleType' || key === 'vehicle_type') {
    return validTypes.includes(value) ? value : 'TRUCK';
  }
  
  return value;
};

// Helper to map frontend camelCase to backend snake_case for requests
const toSnakeCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    registrationNumber: 'registration_number',
    currentMileage: 'current_mileage',
    avgConsumption: 'avg_consumption',
    currentOdometer: 'current_odometer',
    lastServiceDate: 'last_service_date',
    lastServiceOdometer: 'last_service_odometer',
    serviceIntervalDays: 'service_interval_days',
    serviceIntervalKm: 'service_interval_km',
    fuelType: 'fuel_type',
    licensePlate: 'license_plate',
    vehicleType: 'vehicle_type',
    insurancePolicyNumber: 'insurance_policy_number',
    insuranceExpiry: 'insurance_expiry',
    roadworthyExpiry: 'roadworthy_expiry',
    fleetNumber: 'fleet_number',
    assignedDriverId: 'assigned_driver_id',
    gpsTrackerId: 'gps_tracker_id',
    maintenanceStatus: 'maintenance_status',
    nextServiceDue: 'next_service_due',
    nextServiceOdometer: 'next_service_odometer',
    incidentsLogged: 'incidents_logged',
    auditTrail: 'audit_trail',
    purchaseDate: 'purchase_date',
    purchasePrice: 'purchase_price',
    currentValue: 'current_value',
    category: 'category'
  };
  
  Object.keys(data).forEach(key => {
    const snakeKey = mappings[key] || key;
    let value = data[key];
    
    // Validate enum values
    if (key === 'status') {
      value = validateEnumValue('status', value);
    }
    if (key === 'vehicleType') {
      value = validateEnumValue('vehicleType', value);
    }
    
    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
      // Don't include empty strings for optional fields
      if (!['registration_number', 'make', 'model', 'vehicle_type', 'status'].includes(snakeKey)) {
        return; // Skip this key
      }
    }
    
    result[snakeKey] = value;
  });
  
  return result;
};

// Helper to map backend snake_case to frontend camelCase for responses
const toCamelCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    registration_number: 'registrationNumber',
    current_mileage: 'currentMileage',
    avg_consumption: 'avgConsumption',
    current_odometer: 'currentOdometer',
    last_service_date: 'lastServiceDate',
    last_service_odometer: 'lastServiceOdometer',
    service_interval_days: 'serviceIntervalDays',
    service_interval_km: 'serviceIntervalKm',
    fuel_type: 'fuelType',
    license_plate: 'licensePlate',
    vehicle_type: 'vehicleType',
    insurance_policy_number: 'insurancePolicyNumber',
    insurance_expiry: 'insuranceExpiry',
    roadworthy_expiry: 'roadworthyExpiry',
    fleet_number: 'fleetNumber',
    assigned_driver_id: 'assignedDriverId',
    gps_tracker_id: 'gpsTrackerId',
    maintenance_status: 'maintenanceStatus',
    next_service_due: 'nextServiceDue',
    next_service_odometer: 'nextServiceOdometer',
    incidents_logged: 'incidentsLogged',
    audit_trail: 'auditTrail',
    purchase_date: 'purchaseDate',
    purchase_price: 'purchasePrice',
    current_value: 'currentValue'
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

// Helper to process arrays of vehicles
const processVehicles = (data) => {
  if (Array.isArray(data)) {
    return data.map(vehicle => toCamelCase(vehicle));
  }
  if (data?.content && Array.isArray(data.content)) {
    return {
      ...data,
      content: data.content.map(vehicle => toCamelCase(vehicle))
    };
  }
  return data;
};

export const vehicleService = {
  /**
   * Get all vehicles
   * @param {Object} params - Query parameters (page, size, sort, search)
   * @returns {Promise<Array>} List of vehicles
   */
  getAllVehicles: async (params = {}) => {
    try {
      const response = await api.get('/vehicles', { params });
      console.log('Vehicle Service Response:', response);
      
      // Handle different response structures
      const data = response?.data || response;
      
      if (data?.content !== undefined) {
        // Paginated response - process content
        return {
          ...data,
          content: data.content.map(vehicle => toCamelCase(vehicle))
        };
      }
      if (Array.isArray(data)) {
        // Direct array response
        return data.map(vehicle => toCamelCase(vehicle));
      }
      return toCamelCase(data) || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicle by ID
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle object
   */
  getVehicleById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      const data = response?.data || response;
      return toCamelCase(data);
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new vehicle
   * @param {Object} vehicleData - Vehicle data (camelCase)
   * @returns {Promise<Object>} Created vehicle
   */
  createVehicle: async (vehicleData) => {
    try {
      console.log('🚗 Creating vehicle with data (camelCase):', vehicleData);
      
      // Ensure required fields are present
      const requiredFields = ['registrationNumber', 'make', 'model'];
      for (const field of requiredFields) {
        if (!vehicleData[field]) {
          throw new Error(`${field} is required`);
        }
      }
      
      // Convert to snake_case for backend with enum validation
      const payload = toSnakeCase(vehicleData);
      
      // Ensure required fields are in payload
      if (!payload.registration_number) {
        throw new Error('Registration number is required');
      }
      if (!payload.make) {
        throw new Error('Make is required');
      }
      if (!payload.model) {
        throw new Error('Model is required');
      }
      
      console.log('🚗 Sending payload (snake_case):', payload);
      
      const response = await api.post('/vehicles', payload);
      const created = response?.data || response;
      console.log('✅ Vehicle created successfully:', created);
      
      // Return as camelCase for frontend
      return toCamelCase(created);
    } catch (error) {
      console.error('❌ Error creating vehicle:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        throw new Error(`Validation errors: ${errorMessages}`);
      }
      
      // If the error has a message from the server, use it
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    }
  },

  /**
   * Update an existing vehicle
   * @param {number|string} id - Vehicle ID
   * @param {Object} vehicleData - Updated vehicle data (camelCase)
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicle: async (id, vehicleData) => {
    try {
      // Convert to snake_case for backend with enum validation
      const payload = toSnakeCase(vehicleData);
      
      const response = await api.put(`/vehicles/${id}`, payload);
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Patch/Partially update a vehicle
   * @param {number|string} id - Vehicle ID
   * @param {Object} vehicleData - Partial vehicle data (camelCase)
   * @returns {Promise<Object>} Updated vehicle
   */
  patchVehicle: async (id, vehicleData) => {
    try {
      // Convert to snake_case for backend with enum validation
      const payload = toSnakeCase(vehicleData);
      
      const response = await api.patch(`/vehicles/${id}`, payload);
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error patching vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a vehicle
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Deletion response
   */
  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle by registration number
   * @param {string} registrationNumber - Vehicle registration
   * @returns {Promise<Object>} Vehicle object
   */
  getVehicleByRegistration: async (registrationNumber) => {
    try {
      const response = await api.get(`/vehicles/registration/${registrationNumber}`);
      const data = response?.data || response;
      return toCamelCase(data);
    } catch (error) {
      console.error(`Error fetching vehicle by registration ${registrationNumber}:`, error);
      throw error;
    }
  },

  /**
   * Search vehicles
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching vehicles
   */
  searchVehicles: async (searchTerm) => {
    try {
      const response = await api.get('/vehicles/search', {
        params: { q: searchTerm }
      });
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get vehicles by status
   * @param {string} status - Vehicle status
   * @returns {Promise<Array>} List of vehicles with given status
   */
  getVehiclesByStatus: async (status) => {
    try {
      const response = await api.get('/vehicles/status', {
        params: { status }
      });
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error(`Error fetching vehicles with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Get available vehicles (not assigned to active trips)
   * @returns {Promise<Array>} List of available vehicles
   */
  getAvailableVehicles: async () => {
    try {
      const response = await api.get('/vehicles/available');
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  },

  /**
   * Update vehicle status
   * @param {number|string} id - Vehicle ID
   * @param {string} status - New status (must match VehicleStatus enum)
   * @returns {Promise<Object>} Updated vehicle
   */
  updateVehicleStatus: async (id, status) => {
    try {
      // Validate status against enum
      const validStatuses = [
        'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPAIR', 
        'SOLD', 'DECOMMISSIONED', 'AVAILABLE', 'ASSIGNED', 
        'IN_USE', 'OUT_OF_SERVICE', 'RETIRED'
      ];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const response = await api.patch(`/vehicles/${id}/status`, { status });
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error updating vehicle status ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle maintenance history
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Array>} List of maintenance records
   */
  getVehicleMaintenanceHistory: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}/maintenance`);
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error(`Error fetching maintenance history for vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle statistics
   * @param {number|string} id - Vehicle ID
   * @returns {Promise<Object>} Vehicle statistics
   */
  getVehicleStatistics: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}/statistics`);
      const data = response?.data || response;
      return toCamelCase(data);
    } catch (error) {
      console.error(`Error fetching statistics for vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get vehicle trip history
   * @param {number|string} id - Vehicle ID
   * @param {Object} params - Query parameters (page, size, sort)
   * @returns {Promise<Object>} Paginated trip history
   */
  getVehicleTripHistory: async (id, params = {}) => {
    try {
      const response = await api.get(`/vehicles/${id}/trips`, { params });
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error(`Error fetching trip history for vehicle ${id}:`, error);
      throw error;
    }
  }
};

export default vehicleService;
