// src/constants/driverEnums.js
// Driver-related enums from database

export const DRIVER_STATUSES = [
  { id: 19, code: 'AVAILABLE', displayName: 'Available', description: 'Driver is available', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 20, code: 'ASSIGNED', displayName: 'Assigned', description: 'Driver is assigned to trip', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 21, code: 'ON_TRIP', displayName: 'On Trip', description: 'Driver is on a trip', sortOrder: 3, isDefault: false, color: '#2196F3' },
  { id: 22, code: 'ON_LEAVE', displayName: 'On Leave', description: 'Driver is on leave', sortOrder: 4, isDefault: false, color: '#9E9E9E' },
  { id: 23, code: 'SUSPENDED', displayName: 'Suspended', description: 'Driver is suspended', sortOrder: 5, isDefault: false, color: '#F44336' },
  { id: 24, code: 'INACTIVE', displayName: 'Inactive', description: 'Driver is inactive', sortOrder: 6, isDefault: false, color: '#9E9E9E' },
];

export const EMPLOYMENT_TYPES = [
  { id: 162, code: 'FULL_TIME', displayName: 'Full Time', description: 'Full-time employee', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 163, code: 'PART_TIME', displayName: 'Part Time', description: 'Part-time employee', sortOrder: 2, isDefault: false, color: '#2196F3' },
  { id: 164, code: 'CONTRACT', displayName: 'Contract', description: 'Contract employee', sortOrder: 3, isDefault: false, color: '#FF9800' },
  { id: 165, code: 'FREELANCE', displayName: 'Freelance', description: 'Freelance driver', sortOrder: 4, isDefault: false, color: '#9C27B0' },
];

export const GENDER_TYPES = [
  { id: 166, code: 'MALE', displayName: 'Male', description: 'Male driver', sortOrder: 1, isDefault: false },
  { id: 167, code: 'FEMALE', displayName: 'Female', description: 'Female driver', sortOrder: 2, isDefault: false },
  { id: 168, code: 'OTHER', displayName: 'Other', description: 'Other gender', sortOrder: 3, isDefault: false },
];

export const SHIFT_PATTERNS = [
  { id: 192, code: 'DAY', displayName: 'Day Shift', description: 'Day shift pattern', sortOrder: 1, isDefault: true },
  { id: 193, code: 'NIGHT', displayName: 'Night Shift', description: 'Night shift pattern', sortOrder: 2, isDefault: false },
  { id: 194, code: 'ROTATING', displayName: 'Rotating', description: 'Rotating shift pattern', sortOrder: 3, isDefault: false },
  { id: 195, code: 'FLEXIBLE', displayName: 'Flexible', description: 'Flexible shift pattern', sortOrder: 4, isDefault: false },
];

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

export const DRIVER_STATUS_OPTIONS = toOptions(DRIVER_STATUSES);
export const EMPLOYMENT_TYPE_OPTIONS = toOptions(EMPLOYMENT_TYPES);
export const GENDER_OPTIONS = toOptions(GENDER_TYPES);
export const SHIFT_PATTERN_OPTIONS = toOptions(SHIFT_PATTERNS);

export const DRIVER_STATUS_CONFIG = Object.fromEntries(
  DRIVER_STATUSES.map(item => [item.code, item])
);
