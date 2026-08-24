// src/constants/tripEnums.js
// Trip-related enums from database

export const TRIP_STATUSES = [
  { id: 1, code: 'DRAFT', displayName: 'Draft', description: 'Initial draft state', sortOrder: 1, isDefault: false, color: '#9E9E9E', icon: 'Draft' },
  { id: 2, code: 'PLANNED', displayName: 'Planned', description: 'Trip has been planned', sortOrder: 2, isDefault: true, color: '#2196F3', icon: 'Planned' },
  { id: 3, code: 'ASSIGNED', displayName: 'Assigned', description: 'Driver and vehicle assigned', sortOrder: 3, isDefault: false, color: '#FF9800', icon: 'Assigned' },
  { id: 4, code: 'IN_PROGRESS', displayName: 'In Progress', description: 'Trip is in progress', sortOrder: 4, isDefault: false, color: '#4CAF50', icon: 'InProgress' },
  { id: 5, code: 'ON_HOLD', displayName: 'On Hold', description: 'Trip is temporarily paused', sortOrder: 5, isDefault: false, color: '#FF5722', icon: 'OnHold' },
  { id: 6, code: 'COMPLETED', displayName: 'Completed', description: 'Trip has been completed', sortOrder: 6, isDefault: false, color: '#8BC34A', icon: 'Completed' },
  { id: 7, code: 'FINALIZED', displayName: 'Finalized', description: 'Trip has been finalized', sortOrder: 7, isDefault: false, color: '#009688', icon: 'Finalized' },
  { id: 8, code: 'CANCELLED', displayName: 'Cancelled', description: 'Trip has been cancelled', sortOrder: 8, isDefault: false, color: '#F44336', icon: 'Cancelled' },
];

export const TRIP_TYPES = [
  { id: 35, code: 'FREIGHT', displayName: 'Freight', description: 'Standard freight trip', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 36, code: 'RETURN', displayName: 'Return', description: 'Return trip', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 37, code: 'EMPTY', displayName: 'Empty', description: 'Empty trip (no cargo)', sortOrder: 3, isDefault: false, color: '#9E9E9E' },
  { id: 38, code: 'MAINTENANCE', displayName: 'Maintenance', description: 'Maintenance trip', sortOrder: 4, isDefault: false, color: '#F44336' },
  { id: 39, code: 'DEDICATED', displayName: 'Dedicated', description: 'Dedicated customer trip', sortOrder: 5, isDefault: false, color: '#9C27B0' },
  { id: 40, code: 'PROJECT', displayName: 'Project', description: 'Site/Trip Projects', sortOrder: 6, isDefault: false, color: '#E91E1E' },
  { id: 40, code: 'EXPRESS', displayName: 'Express', description: 'Express/urgent delivery', sortOrder: 7, isDefault: false, color: '#E91E63' },
  { id: 41, code: 'CONSOLIDATED', displayName: 'Consolidated', description: 'Consolidated shipment', sortOrder: 7, isDefault: false, color: '#00BCD4' },
];

export const APPROVAL_STATUSES = [
  { id: 9, code: 'PENDING', displayName: 'Pending', description: 'Awaiting approval', sortOrder: 1, isDefault: true, color: '#FF9800', icon: 'Pending' },
  { id: 10, code: 'APPROVED', displayName: 'Approved', description: 'Trip has been approved', sortOrder: 2, isDefault: false, color: '#4CAF50', icon: 'Approved' },
  { id: 11, code: 'REJECTED', displayName: 'Rejected', description: 'Trip has been rejected', sortOrder: 3, isDefault: false, color: '#F44336', icon: 'Rejected' },
  { id: 12, code: 'UNDER_REVIEW', displayName: 'Under Review', description: 'Trip is under review', sortOrder: 4, isDefault: false, color: '#2196F3', icon: 'Review' },
];

export const TRIP_PRIORITIES = [
  { id: 110, code: 'LOW', displayName: 'Low', description: 'Low priority trip', sortOrder: 1, isDefault: false, color: '#4CAF50' },
  { id: 111, code: 'NORMAL', displayName: 'Normal', description: 'Normal priority trip', sortOrder: 2, isDefault: true, color: '#2196F3' },
  { id: 112, code: 'HIGH', displayName: 'High', description: 'High priority trip', sortOrder: 3, isDefault: false, color: '#FF9800' },
  { id: 113, code: 'URGENT', displayName: 'Urgent', description: 'Urgent priority trip', sortOrder: 4, isDefault: false, color: '#F44336' },
];

export const DEPARTURE_TYPES = [
  { id: 118, code: 'DEPOT', displayName: 'Depot', description: 'Depart from depot', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 119, code: 'FREEHAND', displayName: 'Freehand', description: 'Freehand departure location', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 120, code: 'LAST_DROP', displayName: 'Last Drop', description: 'Depart from last drop-off', sortOrder: 3, isDefault: false, color: '#2196F3' },
];

export const DEPARTED_FROM = [
  { id: 176, code: 'DEPOT', displayName: 'Depot', description: 'Departed from depot', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 177, code: 'LAST_DROP', displayName: 'Last Drop-off', description: 'Departed from last drop-off', sortOrder: 2, isDefault: false, color: '#2196F3' },
  { id: 178, code: 'FREEHAND', displayName: 'Freehand', description: 'Freehand departure location', sortOrder: 3, isDefault: false, color: '#FF9800' },
];

// Helper to convert to options format
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

// Pre-computed options for select inputs
export const TRIP_STATUS_OPTIONS = toOptions(TRIP_STATUSES);
export const TRIP_TYPE_OPTIONS = toOptions(TRIP_TYPES);
export const APPROVAL_STATUS_OPTIONS = toOptions(APPROVAL_STATUSES);
export const TRIP_PRIORITY_OPTIONS = toOptions(TRIP_PRIORITIES);
export const DEPARTURE_TYPE_OPTIONS = toOptions(DEPARTURE_TYPES);
export const DEPARTED_FROM_OPTIONS = toOptions(DEPARTED_FROM);

// Config maps for lookups
export const TRIP_STATUS_CONFIG = Object.fromEntries(
  TRIP_STATUSES.map(item => [item.code, item])
);

export const TRIP_TYPE_CONFIG = Object.fromEntries(
  TRIP_TYPES.map(item => [item.code, item])
);

export const APPROVAL_STATUS_CONFIG = Object.fromEntries(
  APPROVAL_STATUSES.map(item => [item.code, item])
);

export const TRIP_PRIORITY_CONFIG = Object.fromEntries(
  TRIP_PRIORITIES.map(item => [item.code, item])
);
