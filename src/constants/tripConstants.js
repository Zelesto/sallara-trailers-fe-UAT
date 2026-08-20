// src/constants/tripConstants.js

export const STATUS_CONFIG = {
  DRAFT: { color: '#9e9e9e', bgColor: '#f5f5f5', label: 'Draft', icon: '✏️' },
  PLANNED: { color: '#0288d1', bgColor: '#e3f2fd', label: 'Planned', icon: '📅' },
  ASSIGNED: { color: '#7b1fa2', bgColor: '#f3e5f5', label: 'Assigned', icon: '👤' },
  IN_PROGRESS: { color: '#ed6c02', bgColor: '#fff3e0', label: 'In Progress', icon: '🚚' },
  ACTIVE: { color: '#2e7d32', bgColor: '#e8f5e8', label: 'Active', icon: '✅' },
  PENDING: { color: '#ff9800', bgColor: '#fff3e0', label: 'Pending', icon: '⏳' },
  COMPLETED: { color: '#0097a7', bgColor: '#e0f7fa', label: 'Completed', icon: '🏁' },
  CANCELLED: { color: '#d32f2f', bgColor: '#ffebee', label: 'Cancelled', icon: '❌' },
  CLOSED: { color: '#5d4037', bgColor: '#efebe9', label: 'Closed', icon: '🔒' },
  FINALIZED: { color: '#388e3c', bgColor: '#e8f5e8', label: 'Finalized', icon: '📊' }
};

export const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

export const TRIP_TYPE_CONFIG = {
  FREIGHT: { label: 'Freight', color: 'primary' },
  RETURN: { label: 'Return', color: 'success' },
  EMPTY: { label: 'Empty', color: 'warning' },
  PROJECT: { label: 'Project', color: 'purple' },
};

export const TRIP_TYPE_OPTIONS = Object.keys(TRIP_TYPE_CONFIG);

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'success' },
  MEDIUM: { label: 'Medium', color: 'warning' },
  HIGH: { label: 'High', color: 'error' },
  URGENT: { label: 'Urgent', color: 'error' },
};

export const PRIORITY_OPTIONS = Object.keys(PRIORITY_CONFIG);

export const APPROVAL_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  UNDER_REVIEW: { label: 'Under Review', color: 'info' },
};

export const APPROVAL_STATUS_OPTIONS = Object.keys(APPROVAL_STATUS_CONFIG);

// Commodity options
export const COMMODITY_OPTIONS = [
  'General Freight', 'Transformers', 'Big Drums',
  'Small Drums', 'Meter Boxes', 'Mixed Materials',
  'Car Parts', 'Circuit Breakers', 'Pallets', 'Poles',
  'CAT 426', 'CAT 140', '996', '226',
  'CS11GC', 'Components', 'Oil', 'Other'
];

// Province options
export const PROVINCE_OPTIONS = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];

// Departure options
export const DEPARTURE_OPTIONS = [
  { value: 'DEPOT', label: 'Depot' },
  { value: 'LAST_DROP', label: 'Last Drop Off Location' },
  { value: 'FREEHAND', label: 'Freehand / Custom Location' }
];
