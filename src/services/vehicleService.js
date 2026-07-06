// src/services/vehicleService.js
import api from './api';

// Helper to map frontend camelCase to backend snake_case for requests
const toSnakeCase = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const result = {};
  const mappings = {
    // Basic fields
    registrationNumber: 'registration_number',
    currentMileage: 'current_mileage',
    avgConsumption: 'avg_consumption',
    currentOdometer: 'current_odometer',
    lastServiceDate: 'last_service_date',
    lastServiceOdometer: 'last_service_odometer',
    serviceIntervalDays: 'service_interval_days',
    serviceIntervalKm: 'service_interval_km',
    fuelType: 'fuel_type',
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
    category: 'category',
    createdBy: 'created_by',
    updatedBy: 'updated_by',
    isActive: 'is_active',
    version: 'version',
    maintenanceCost: 'maintenance_cost',
    lastMaintenanceDate: 'last_maintenance_date',
    nextMaintenanceDue: 'next_maintenance_due',
    fuelEfficiency: 'fuel_efficiency',
    insuranceProvider: 'insurance_provider',
    insuranceExpiryDate: 'insurance_expiry_date'
  };
  
  Object.keys(data).forEach(key => {
    const snakeKey = mappings[key] || key;
    // Skip undefined values
    if (data[key] === undefined) {
      return;
    }
    // Include null values for fields that should be explicitly set to null
    if (data[key] === undefined || data[key] === null) {
  return;
}
    result[snakeKey] = data[key];
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
    current_value: 'currentValue',
    category: 'category',
    created_by: 'createdBy',
    updated_by: 'updatedBy',
    is_active: 'isActive',
    version: 'version',
    maintenance_cost: 'maintenanceCost',
    last_maintenance_date: 'lastMaintenanceDate',
    next_maintenance_due: 'nextMaintenanceDue',
    fuel_efficiency: 'fuelEfficiency',
    insurance_provider: 'insuranceProvider',
    insurance_expiry_date: 'insuranceExpiryDate'
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
  getAllVehicles: async (params = {}) => {
    try {
      const response = await api.get('/vehicles', { params });
      console.log('Vehicle Service Response:', response);
      
      const data = response?.data || response;
      
      if (data?.content !== undefined) {
        return {
          ...data,
          content: data.content.map(vehicle => toCamelCase(vehicle))
        };
      }
      if (Array.isArray(data)) {
        return data.map(vehicle => toCamelCase(vehicle));
      }
      return toCamelCase(data) || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

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

  createVehicle: async (vehicleData) => {
    try {
      console.log('🚗 Creating vehicle with data (camelCase):', vehicleData);
      
      // Build payload with only the fields that exist in the database
      const payload = {};
      
      // Required fields
      if (vehicleData.registrationNumber) {
        payload.registration_number = vehicleData.registrationNumber;
      } else {
        throw new Error('Registration number is required');
      }
      
      if (vehicleData.make) {
        payload.make = vehicleData.make;
      } else {
        throw new Error('Make is required');
      }
      
      if (vehicleData.model) {
        payload.model = vehicleData.model;
      } else {
        throw new Error('Model is required');
      }
      
      // Optional fields - only include if they have values
      if (vehicleData.vin) payload.vin = vehicleData.vin;
      if (vehicleData.year) payload.year = vehicleData.year;
      if (vehicleData.fuelType) payload.fuel_type = vehicleData.fuelType;
      if (vehicleData.vehicleType) payload.vehicle_type = vehicleData.vehicleType;
      if (vehicleData.status) payload.status = vehicleData.status;
      
      // Numeric fields - only include if they have values
      if (vehicleData.currentMileage !== undefined && vehicleData.currentMileage !== null && vehicleData.currentMileage !== '') {
        payload.current_mileage = parseFloat(vehicleData.currentMileage);
      }
      if (vehicleData.currentOdometer !== undefined && vehicleData.currentOdometer !== null && vehicleData.currentOdometer !== '') {
        payload.current_odometer = parseFloat(vehicleData.currentOdometer);
      }
      if (vehicleData.avgConsumption !== undefined && vehicleData.avgConsumption !== null && vehicleData.avgConsumption !== '') {
        payload.avg_consumption = parseFloat(vehicleData.avgConsumption);
      }
      if (vehicleData.lastServiceOdometer !== undefined && vehicleData.lastServiceOdometer !== null && vehicleData.lastServiceOdometer !== '') {
        payload.last_service_odometer = parseFloat(vehicleData.lastServiceOdometer);
      }
      if (vehicleData.serviceIntervalDays !== undefined && vehicleData.serviceIntervalDays !== null && vehicleData.serviceIntervalDays !== '') {
        payload.service_interval_days = parseInt(vehicleData.serviceIntervalDays);
      }
      if (vehicleData.serviceIntervalKm !== undefined && vehicleData.serviceIntervalKm !== null && vehicleData.serviceIntervalKm !== '') {
        payload.service_interval_km = parseFloat(vehicleData.serviceIntervalKm);
      }
      if (vehicleData.purchasePrice !== undefined && vehicleData.purchasePrice !== null && vehicleData.purchasePrice !== '') {
        payload.purchase_price = parseFloat(vehicleData.purchasePrice);
      }
      if (vehicleData.currentValue !== undefined && vehicleData.currentValue !== null && vehicleData.currentValue !== '') {
        payload.current_value = parseFloat(vehicleData.currentValue);
      }
      
      // Date fields
      if (vehicleData.lastServiceDate) payload.last_service_date = vehicleData.lastServiceDate;
      if (vehicleData.insuranceExpiry) payload.insurance_expiry = vehicleData.insuranceExpiry;
      if (vehicleData.roadworthyExpiry) payload.roadworthy_expiry = vehicleData.roadworthyExpiry;
      if (vehicleData.purchaseDate) payload.purchase_date = vehicleData.purchaseDate;
      
      // String fields
      if (vehicleData.insurancePolicyNumber) payload.insurance_policy_number = vehicleData.insurancePolicyNumber;
      if (vehicleData.fleetNumber) payload.fleet_number = vehicleData.fleetNumber;
      if (vehicleData.notes) payload.notes = vehicleData.notes;
      if (vehicleData.category) payload.category = vehicleData.category;
      
      console.log('🚗 Sending payload (snake_case):', payload);
      
      const response = await api.post('/vehicles', payload);
      const created = response?.data || response;
      console.log('✅ Vehicle created successfully:', created);
      
      return toCamelCase(created);
    } catch (error) {
      console.error('❌ Error creating vehicle:', error);
      
      if (error.response) {
        console.error('❌ Error status:', error.response.status);
        console.error('❌ Error data:', error.response.data);
        
        if (error.response.data?.message) {
          throw new Error(error.response.data.message);
        }
        if (error.response.data?.detail) {
          throw new Error(error.response.data.detail);
        }
        if (error.response.data?.errors) {
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new Error(`Validation errors: ${errorMessages}`);
        }
      }
      
      throw new Error(error.message || 'Failed to create vehicle');
    }
  },

  updateVehicle: async (id, vehicleData) => {
    try {
      const payload = toSnakeCase(vehicleData);
      const response = await api.put(`/vehicles/${id}`, payload);
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },

  patchVehicle: async (id, vehicleData) => {
    try {
      const payload = toSnakeCase(vehicleData);
      const response = await api.patch(`/vehicles/${id}`, payload);
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error patching vehicle ${id}:`, error);
      throw error;
    }
  },

  deleteVehicle: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },

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

  updateVehicleStatus: async (id, status) => {
    try {
      const response = await api.patch(`/vehicles/${id}/status`, { status });
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`Error updating vehicle status ${id}:`, error);
      throw error;
    }
  },

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
