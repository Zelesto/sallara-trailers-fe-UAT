// src/services/vehicleService.js
import api from './api';

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
    insuranceExpiryDate: 'insurance_expiry_date',
    // New fuel fields
    fuelCapacity: 'fuel_capacity',
    currentFuelLevel: 'current_fuel_level',
    virtualConsumption: 'virtual_consumption',
    fuelTankCount: 'fuel_tank_count',
    fuelTankType: 'fuel_tank_type',
    lastFuelUpdate: 'last_fuel_update',
  };
  
  Object.keys(data).forEach(key => {
    const snakeKey = mappings[key] || key;
    if (data[key] === undefined) {
      return;
    }
    result[snakeKey] = data[key];
  });
  
  if (result.vehicle_type === undefined || result.vehicle_type === null) {
    result.vehicle_type = 'TRUCK';
  }
  if (result.status === undefined || result.status === null) {
    result.status = 'ACTIVE';
  }
  if (result.fuel_type === undefined || result.fuel_type === null) {
    result.fuel_type = 'DIESEL';
  }
  
  return result;
};

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
    insurance_expiry_date: 'insuranceExpiryDate',
    // New fuel fields
    fuel_capacity: 'fuelCapacity',
    current_fuel_level: 'currentFuelLevel',
    virtual_consumption: 'virtualConsumption',
    fuel_tank_count: 'fuelTankCount',
    fuel_tank_type: 'fuelTankType',
    last_fuel_update: 'lastFuelUpdate',
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

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
  // ====== VEHICLE CRUD ======
  
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
      const payload = toSnakeCase(vehicleData);
      console.log('🚗 Sending payload (snake_case):', JSON.stringify(payload, null, 2));
      
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
      console.log('📤 Original vehicle data:', vehicleData);
      const payload = toSnakeCase(vehicleData);
      console.log('📤 Payload being sent:', JSON.stringify(payload, null, 2));
      
      const response = await api.put(`/vehicles/${id}`, payload);
      console.log('📥 Response:', response);
      
      const updated = response?.data || response;
      return toCamelCase(updated);
    } catch (error) {
      console.error(`❌ Error updating vehicle ${id}:`, error);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
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

  // ====== VEHICLE STATUS ======
  
  getVehiclesByStatus: async (status) => {
    try {
      const response = await api.get(`/vehicles/status/${status}`);
      const data = response?.data || response;
      return processVehicles(data);
    } catch (error) {
      console.error(`Error fetching vehicles with status ${status}:`, error);
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

  // ====== VEHICLE SEARCH ======
  
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

  // ====== VEHICLE FUEL MANAGEMENT ======
  
  getFuelStatus: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/fuel-status`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching fuel status for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  updateFuelLevel: async (vehicleId, fuelData) => {
    try {
      const payload = toSnakeCase(fuelData);
      const response = await api.put(`/vehicles/${vehicleId}/fuel-level`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error updating fuel level for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  resetFuelToFull: async (vehicleId, odometerReading = null, tankNumber = 1) => {
    try {
      const response = await api.post(`/vehicles/${vehicleId}/fuel/reset`, null, {
        params: { odometerReading, tankNumber }
      });
      return response;
    } catch (error) {
      console.error(`Error resetting fuel for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  getFuelConsumption: async (vehicleId, startDate, endDate) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/fuel-consumption`, {
        params: { startDate, endDate }
      });
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching fuel consumption for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  getFuelSummary: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/fuel-summary`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching fuel summary for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // ====== VEHICLE CERTIFICATES ======
  
  getCertificates: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/certificates`);
      return processVehicles(response);
    } catch (error) {
      console.error(`Error fetching certificates for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  addCertificate: async (vehicleId, certificateData) => {
    try {
      const payload = toSnakeCase(certificateData);
      const response = await api.post(`/vehicles/${vehicleId}/certificates`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error adding certificate for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  updateCertificate: async (vehicleId, certificateId, certificateData) => {
    try {
      const payload = toSnakeCase(certificateData);
      const response = await api.put(`/vehicles/${vehicleId}/certificates/${certificateId}`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error updating certificate for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // ====== VEHICLE MAINTENANCE ======
  
  getMaintenanceSchedule: async (vehicleId) => {
    try {
      const response = await api.get(`/vehicles/${vehicleId}/maintenance`);
      return processVehicles(response);
    } catch (error) {
      console.error(`Error fetching maintenance schedule for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  addMaintenance: async (vehicleId, maintenanceData) => {
    try {
      const payload = toSnakeCase(maintenanceData);
      const response = await api.post(`/vehicles/${vehicleId}/maintenance`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error adding maintenance for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  updateMaintenance: async (vehicleId, maintenanceId, maintenanceData) => {
    try {
      const payload = toSnakeCase(maintenanceData);
      const response = await api.put(`/vehicles/${vehicleId}/maintenance/${maintenanceId}`, payload);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error updating maintenance for vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // ====== VEHICLE STATISTICS ======
  
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

  // ====== VEHICLE DRIVER ASSIGNMENT ======
  
  assignDriver: async (vehicleId, driverId) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/assign-driver/${driverId}`);
      return response;
    } catch (error) {
      console.error(`Error assigning driver to vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  unassignDriver: async (vehicleId) => {
    try {
      const response = await api.put(`/vehicles/${vehicleId}/unassign-driver`);
      return response;
    } catch (error) {
      console.error(`Error unassigning driver from vehicle ${vehicleId}:`, error);
      throw error;
    }
  },
};

export default vehicleService;
