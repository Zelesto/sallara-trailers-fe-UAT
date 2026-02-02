// User roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DISPATCHER: 'DISPATCHER',
  FINANCE: 'FINANCE',
  DRIVER: 'DRIVER'
};

// Trip statuses
export const TRIP_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELAYED: 'DELAYED'
};

export const TRIP_STATUS_COLORS = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
  DELAYED: 'secondary'
};

// Vehicle statuses
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

// Fuel types
export const FUEL_TYPES = {
  DIESEL: 'DIESEL',
  PETROL: 'PETROL',
  CNG: 'CNG',
  ELECTRIC: 'ELECTRIC'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile'
  },
  TRIPS: '/api/trips',
  VEHICLES: '/api/vehicles',
  DRIVERS: '/api/drivers',
  FUEL: '/api/fuel',
  INVENTORY: '/api/inventory',
  ANALYTICS: '/api/analytics'
};