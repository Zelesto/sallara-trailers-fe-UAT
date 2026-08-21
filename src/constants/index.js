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
  PAYMENT_METHODS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_CONFIG,
} from './fuelEnums';

// Expense enums
export {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_CATEGORY_CONFIG,
} from './expenseEnums';

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
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_OPTIONS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_OPTIONS,
  RECONCILIATION_STATUSES,
  RECONCILIATION_STATUS_OPTIONS,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  INVOICE_ITEM_TYPES,
  INVOICE_TAX_RATES,
  INVOICE_TYPE_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  INVOICE_ITEM_TYPE_OPTIONS,
  INVOICE_TAX_RATE_OPTIONS,
  INVOICE_TYPE_CONFIG,
  INVOICE_STATUS_CONFIG,
  INVOICE_ITEM_TYPE_CONFIG,
  INVOICE_TAX_RATE_CONFIG,
} from './financeEnums';

// POD enums
export {
  POD_STATUSES,
  POD_STATUS_OPTIONS,
  POD_STATUS_CONFIG,
} from './podEnums';

// Customer enums
export {
  PAYMENT_TERMS,
  CURRENCIES,
  CUSTOMER_TYPES,
  INDUSTRY_TYPES,
  PAYMENT_TERMS_OPTIONS,
  CURRENCY_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
} from './customerEnums';

// ============================================================
// HELPER FUNCTIONS - Only defined once here
// ============================================================

/**
 * Get display name from enum code
 * @param {Array} items - Array of enum items
 * @param {string} code - The enum code
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Display name
 */
export const getDisplayName = (items, code, defaultValue = null) => {
  if (!items || !Array.isArray(items) || !code) {
    return defaultValue || code || 'Unknown';
  }
  const item = items.find(i => i.code === code || i.value === code);
  return item?.displayName || item?.label || defaultValue || code || 'Unknown';
};

/**
 * Get color from enum code
 * @param {Array} items - Array of enum items
 * @param {string} code - The enum code
 * @param {string} defaultColor - Default color if not found
 * @returns {string} Color code
 */
export const getColor = (items, code, defaultColor = '#9E9E9E') => {
  if (!items || !Array.isArray(items) || !code) {
    return defaultColor;
  }
  const item = items.find(i => i.code === code || i.value === code);
  return item?.color || item?.colorCode || defaultColor;
};

/**
 * Helper to convert any list to options
 * @param {Array} items - Array of items
 * @returns {Array} Array of options {value, label, ...item}
 */
export const toOptions = (items) => {
  if (!items || !Array.isArray(items)) {
    return [];
  }
  return items.map(item => ({
    value: item.code || item.id || '',
    label: item.displayName || item.name || item.code || 'Unknown',
    color: item.color || item.colorCode || null,
    description: item.description || null,
    isDefault: item.isDefault || false,
    sortOrder: item.sortOrder || 0,
    ...item
  }));
};

