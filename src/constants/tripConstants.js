// src/constants/tripConstants.js
export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'default', bgColor: '#F3F4F6' },
  PLANNED: { label: 'Planned', color: 'info', bgColor: '#DBEAFE' },
  ASSIGNED: { label: 'Assigned', color: 'primary', bgColor: '#E0E7FF' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning', bgColor: '#FEF3C7' },
  ACTIVE: { label: 'Active', color: 'warning', bgColor: '#FEF3C7' },
  COMPLETED: { label: 'Completed', color: 'success', bgColor: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: 'error', bgColor: '#FEE2E2' },
  PENDING: { label: 'Pending', color: 'warning', bgColor: '#FEF3C7' },
  CLOSED: { label: 'Closed', color: 'default', bgColor: '#F3F4F6' },
  FINALIZED: { label: 'Finalized', color: 'success', bgColor: '#D1FAE5' },
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
