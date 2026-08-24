// src/constants/loadEnums.js
// Load-related enums from database

export const LOAD_STATUSES = [
  { id: 13, code: 'PENDING', displayName: 'Pending', description: 'Load is pending', sortOrder: 1, isDefault: true, color: '#FF9800' },
  { id: 14, code: 'PLANNED', displayName: 'Planned', description: 'Load has been planned', sortOrder: 2, isDefault: false, color: '#2196F3' },
  { id: 15, code: 'IN_TRANSIT', displayName: 'In Transit', description: 'Load is in transit', sortOrder: 3, isDefault: false, color: '#4CAF50' },
  { id: 16, code: 'DELIVERED', displayName: 'Delivered', description: 'Load has been delivered', sortOrder: 4, isDefault: false, color: '#8BC34A' },
  { id: 17, code: 'COMPLETED', displayName: 'Completed', description: 'Load has been completed', sortOrder: 5, isDefault: false, color: '#009688' },
  { id: 18, code: 'CANCELLED', displayName: 'Cancelled', description: 'Load has been cancelled', sortOrder: 6, isDefault: false, color: '#F44336' },
];

export const LOAD_PRIORITIES = [
  { id: 114, code: 'LOW', displayName: 'Low', description: 'Low priority load', sortOrder: 1, isDefault: false, color: '#4CAF50' },
  { id: 115, code: 'NORMAL', displayName: 'Normal', description: 'Normal priority load', sortOrder: 2, isDefault: true, color: '#2196F3' },
  { id: 116, code: 'HIGH', displayName: 'High', description: 'High priority load', sortOrder: 3, isDefault: false, color: '#FF9800' },
  { id: 117, code: 'URGENT', displayName: 'Urgent', description: 'Urgent priority load', sortOrder: 4, isDefault: false, color: '#F44336' },
];

export const CUSTOMS_STATUSES = [
  { id: 179, code: 'PENDING', displayName: 'Pending', description: 'Customs clearance pending', sortOrder: 1, isDefault: true, color: '#FF9800' },
  { id: 180, code: 'CLEARED', displayName: 'Cleared', description: 'Customs clearance completed', sortOrder: 2, isDefault: false, color: '#4CAF50' },
  { id: 181, code: 'REJECTED', displayName: 'Rejected', description: 'Customs clearance rejected', sortOrder: 3, isDefault: false, color: '#F44336' },
  { id: 182, code: 'INSPECTION', displayName: 'Inspection', description: 'Customs inspection in progress', sortOrder: 4, isDefault: false, color: '#2196F3' },
];

// Helper
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

export const LOAD_STATUS_OPTIONS = toOptions(LOAD_STATUSES);
export const LOAD_PRIORITY_OPTIONS = toOptions(LOAD_PRIORITIES);
export const CUSTOMS_STATUS_OPTIONS = toOptions(CUSTOMS_STATUSES);

export const LOAD_STATUS_CONFIG = Object.fromEntries(
  LOAD_STATUSES.map(item => [item.code, item])
);

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export const getColor = (colorName) => {
  const colors = {
    primary: '#4F46E5',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    secondary: '#6B7280',
    purple: '#8B5CF6',
    pink: '#EC4899',
    teal: '#14B8A6',
    indigo: '#6366F1',
  };
  return colors[colorName] || '#4F46E5';
};

export const getColorBg = (color) => {
  const bgColors = {
    primary: '#EEF2FF',
    success: '#D1FAE5',
    warning: '#FEF3C7',
    error: '#FEE2E2',
    info: '#DBEAFE',
    secondary: '#F3F4F6',
    purple: '#EDE9FE',
    pink: '#FCE7F3',
    teal: '#CCFBF1',
    indigo: '#E0E7FF',
  };
  return bgColors[color] || bgColors.primary;
};
