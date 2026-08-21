// src/constants/index.js
// Main export file for all enums

// Trip enums
export {
  TRIP_STATUSES,
  TRIP_TYPES,
  APPROVAL_STATUSES,
  TRIP_PRIORITIES,
  DEPARTURE_TYPES,
  DEPARTED_FROM,
  TRIP_STATUS_OPTIONS,
  TRIP_TYPE_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  TRIP_PRIORITY_OPTIONS,
  DEPARTURE_TYPE_OPTIONS,
  DEPARTED_FROM_OPTIONS,
  TRIP_STATUS_CONFIG,
  TRIP_TYPE_CONFIG,
  APPROVAL_STATUS_CONFIG,
  TRIP_PRIORITY_CONFIG,
} from './tripEnums';

// Load enums
export {
  LOAD_STATUSES,
  LOAD_PRIORITIES,
  CUSTOMS_STATUSES,
  LOAD_STATUS_OPTIONS,
  LOAD_PRIORITY_OPTIONS,
  CUSTOMS_STATUS_OPTIONS,
  LOAD_STATUS_CONFIG,
} from './loadEnums';

// Fuel enums
export {
  FUEL_TYPES,
  FUEL_TYPE_OPTIONS,
  FUEL_TYPE_CONFIG,

  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_CONFIG,
  toOptions as fuelToOptions,
  getDisplayName,
  getColor,
} from './fuelEnums';

// Driver enums
export {
  DRIVER_STATUSES,
  EMPLOYMENT_TYPES,
  GENDER_TYPES,
  SHIFT_PATTERNS,
  DRIVER_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  SHIFT_PATTERN_OPTIONS,
  DRIVER_STATUS_CONFIG,
} from './driverEnums';

// Vehicle enums
export {
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  FUEL_TANK_TYPES,
  MAINTENANCE_STATUSES,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  FUEL_TANK_TYPE_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  VEHICLE_STATUS_CONFIG,
} from './vehicleEnums';

// Cargo enums
export {
  COMMODITY_TYPES,
  PACKAGING_TYPES,
  HAZARD_CLASSES,
  TEMPERATURE_REQUIREMENTS,
  COMMODITY_OPTIONS,
  PACKAGING_OPTIONS,
  HAZARD_CLASS_OPTIONS,
  TEMPERATURE_OPTIONS,
  COMMODITY_CONFIG,
} from './cargoEnums';

// Finance enums
export {
  PAYMENT_METHODS,
  ACCOUNT_TYPES,
  PAYMENT_STATUSES,
  RECONCILIATION_STATUSES,
  PAYMENT_METHOD_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  RECONCILIATION_STATUS_OPTIONS,
} from './financeEnums';

// POD enums
export {
  POD_STATUSES,
  POD_STATUS_OPTIONS,
  POD_STATUS_CONFIG,
} from './podEnums';

// Helper function to get display name from code
export const getDisplayName = (items, code) => {
  const item = items.find(i => i.code === code);
  return item?.displayName || code;
};

// Helper function to get color from code
export const getColor = (items, code, defaultColor = '#9E9E9E') => {
  const item = items.find(i => i.code === code);
  return item?.color || defaultColor;
};

// Helper to convert any list to options
export const toOptions = (items) => 
  items.map(item => ({
    value: item.code,
    label: item.displayName,
    color: item.color,
    description: item.description,
    isDefault: item.isDefault,
    sortOrder: item.sortOrder,
    ...item
  }));
