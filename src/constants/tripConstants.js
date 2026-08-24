// src/constants/tripConstants.js

// ============================================================
// TRIP STATUSES - Main export for TripList
// ============================================================
export const TRIP_STATUSES = [
  { code: 'DRAFT', displayName: 'Draft', color: '#9e9e9e', icon: '✏️' },
  { code: 'PLANNED', displayName: 'Planned', color: '#0288d1', icon: '📅' },
  { code: 'ASSIGNED', displayName: 'Assigned', color: '#7b1fa2', icon: '👤' },
  { code: 'IN_PROGRESS', displayName: 'In Progress', color: '#ed6c02', icon: '🚚' },
  { code: 'ACTIVE', displayName: 'Active', color: '#2e7d32', icon: '✅' },
  { code: 'PENDING', displayName: 'Pending', color: '#ff9800', icon: '⏳' },
  { code: 'COMPLETED', displayName: 'Completed', color: '#0097a7', icon: '🏁' },
  { code: 'CANCELLED', displayName: 'Cancelled', color: '#d32f2f', icon: '❌' },
  { code: 'CLOSED', displayName: 'Closed', color: '#5d4037', icon: '🔒' },
  { code: 'FINALIZED', displayName: 'Finalized', color: '#388e3c', icon: '📊' }
];

// ============================================================
// TRIP STATUS OPTIONS - For dropdowns and filters
// ============================================================
export const TRIP_STATUS_OPTIONS = TRIP_STATUSES.map(item => ({
  value: item.code,
  label: item.displayName,
  color: item.color,
}));

// ============================================================
// TRIP STATUS CONFIG - For chips and status display
// ============================================================
export const TRIP_STATUS_CONFIG = Object.fromEntries(
  TRIP_STATUSES.map(item => [
    item.code,
    {
      color: item.color,
      bgColor: item.color ? `${item.color}20` : '#f5f5f5',
      label: item.displayName,
      icon: item.icon || '📋'
    }
  ])
);

// ============================================================
// OLD STYLE - Keep for backward compatibility
// ============================================================
export const STATUS_CONFIG = TRIP_STATUS_CONFIG;
export const STATUS_OPTIONS = TRIP_STATUS_OPTIONS;

// ============================================================
// TRIP TYPE CONFIG
// ============================================================
export const TRIP_TYPE_CONFIG = {
  FREIGHT: { label: 'Freight', color: 'primary' },
  RETURN: { label: 'Return', color: 'success' },
  EMPTY: { label: 'Empty', color: 'warning' },
  PROJECT: { label: 'Project', color: 'purple' },
};

export const TRIP_TYPE_OPTIONS = Object.keys(TRIP_TYPE_CONFIG);

// ============================================================
// PRIORITY CONFIG
// ============================================================
export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' },
  URGENT: { label: 'Urgent', color: 'error' },
};

export const PRIORITY_OPTIONS = Object.keys(PRIORITY_CONFIG);

// ============================================================
// APPROVAL STATUS CONFIG
// ============================================================
export const APPROVAL_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  UNDER_REVIEW: { label: 'Under Review', color: 'info' },
};

export const APPROVAL_STATUS_OPTIONS = Object.keys(APPROVAL_STATUS_CONFIG);

// ============================================================
// COMMODITY OPTIONS
// ============================================================
export const COMMODITY_OPTIONS = [
  'General Freight', 'Transformers', 'Big Drums',
  'Small Drums', 'Meter Boxes', 'Mixed Materials',
  'Car Parts', 'Circuit Breakers', 'Pallets', 'Poles',
  'CAT 426', 'CAT 140', '996', '226',
  'CS11GC', 'Components', 'Oil', 'Other'
];

// ============================================================
// PROVINCE OPTIONS
// ============================================================
export const PROVINCE_OPTIONS = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

// ============================================================
// DEPARTURE OPTIONS
// ============================================================
export const DEPARTURE_OPTIONS = [
  { value: 'DEPOT', label: 'Depot' },
  { value: 'LAST_DROP', label: 'Last Drop Off Location' },
  { value: 'FREEHAND', label: 'Freehand / Custom Location' }
];

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
