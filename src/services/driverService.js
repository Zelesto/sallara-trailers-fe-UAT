// src/services/driverService.js
import api from './api';

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
    appUserId: 'app_user_id',
    // New fields
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    country: 'country',
    address: 'address',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone',
    bankName: 'bank_name',
    bankAccountNumber: 'bank_account_number',
    bankBranchCode: 'bank_branch_code',
    taxNumber: 'tax_number',
    lastMedicalExamDate: 'last_medical_exam_date',
    nextMedicalExamDate: 'next_medical_exam_date',
    driverLicenseClass: 'driver_license_class',
    licenseIssueDate: 'license_issue_date',
    licenseRestrictions: 'license_restrictions',
    endorsements: 'endorsements',
    driverPhotoUrl: 'driver_photo_url',
    employeeId: 'employee_id',
    department: 'department',
    supervisorId: 'supervisor_id',
    lastTripDate: 'last_trip_date',
    lastClockIn: 'last_clock_in',
    lastClockOut: 'last_clock_out',
    currentStatus: 'current_status',
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
    app_user_id: 'appUserId',
    // New fields
    date_of_birth: 'dateOfBirth',
    gender: 'gender',
    country: 'country',
    address: 'address',
    emergency_contact_name: 'emergencyContactName',
    emergency_contact_phone: 'emergencyContactPhone',
    bank_name: 'bankName',
    bank_account_number: 'bankAccountNumber',
    bank_branch_code: 'bankBranchCode',
    tax_number: 'taxNumber',
    last_medical_exam_date: 'lastMedicalExamDate',
    next_medical_exam_date: 'nextMedicalExamDate',
    driver_license_class: 'driverLicenseClass',
    license_issue_date: 'licenseIssueDate',
    license_restrictions: 'licenseRestrictions',
    endorsements: 'endorsements',
    driver_photo_url: 'driverPhotoUrl',
    employee_id: 'employeeId',
    department: 'department',
    supervisor_id: 'supervisorId',
    last_trip_date: 'lastTripDate',
    last_clock_in: 'lastClockIn',
    last_clock_out: 'lastClockOut',
    current_status: 'currentStatus',
  };
  
  Object.keys(data).forEach(key => {
    const camelKey = mappings[key] || key;
    result[camelKey] = data[key];
  });
  
  return result;
};

export const driverService = {
  // ====== DRIVER CRUD ======
  
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

  getDriverById: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },

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

  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/drivers/${id}`);
      return response;
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  },

  // ====== DRIVER STATUS ======
  
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

  updateDriverStatus: async (id, status) => {
    try {
      const response = await api.put(`/drivers/${id}/status/${status}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error updating driver status ${id}:`, error);
      throw error;
    }
  },

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

  // ====== DRIVER LICENSES ======
  
  getDriverByLicense: async (licenseNumber) => {
    try {
      const response = await api.get(`/drivers/license/${licenseNumber}`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching driver by license ${licenseNumber}:`, error);
      throw error;
    }
  },

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
  },

  verifyDriverLicense: async (id) => {
    try {
      const response = await api.post(`/drivers/${id}/verify-license`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error verifying license for driver ${id}:`, error);
      throw error;
    }
  },

  // ====== DRIVER ASSIGNMENTS ======
  
  assignVehicle: async (driverId, vehicleId) => {
    try {
      const response = await api.put(`/drivers/${driverId}/assign-vehicle/${vehicleId}`);
      return response;
    } catch (error) {
      console.error(`Error assigning vehicle to driver ${driverId}:`, error);
      throw error;
    }
  },

  unassignVehicle: async (driverId) => {
    try {
      const response = await api.put(`/drivers/${driverId}/unassign-vehicle`);
      return response;
    } catch (error) {
      console.error(`Error unassigning vehicle from driver ${driverId}:`, error);
      throw error;
    }
  },

  // ====== DRIVER STATISTICS ======
  
  getDriverStatistics: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}/statistics`);
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching statistics for driver ${id}:`, error);
      throw error;
    }
  },

  getDriverPerformance: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/performance`, { params });
      return toCamelCase(response);
    } catch (error) {
      console.error(`Error fetching performance for driver ${id}:`, error);
      throw error;
    }
  },

  getDriverTripHistory: async (id, params = {}) => {
    try {
      const response = await api.get(`/drivers/${id}/trips`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching trip history for driver ${id}:`, error);
      throw error;
    }
  },

  // ====== DRIVER TIMESHEET ======
  
  punch: async (punchData) => {
    try {
      const response = await api.post('/timesheet/punch', punchData);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error processing punch:', error);
      throw error;
    }
  },

  getTimesheetEntries: async (driverId, startDate, endDate) => {
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

  getActivePunch: async (driverId) => {
    try {
      const response = await api.get(`/timesheet/driver/${driverId}/active`);
      return toCamelCase(response);
    } catch (error) {
      console.error('Error fetching active punch:', error);
      throw error;
    }
  },

  // ====== DRIVER LEAVE ======
  
  requestLeave: async (leaveData) => {
    try {
      const response = await api.post('/leave/request', leaveData);
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

  // ====== DRIVER SEARCH ======
  
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
};

export default driverService;
