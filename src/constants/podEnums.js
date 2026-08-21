// src/constants/podEnums.js
export const POD_STATUSES = [
  { id: 30, code: 'SCANNED', displayName: 'Scanned', color: 'info' },
  { id: 31, code: 'PENDING', displayName: 'Pending', color: 'warning' },
  { id: 32, code: 'DELIVERED', displayName: 'Delivered', color: 'success' },
  { id: 33, code: 'VERIFIED', displayName: 'Verified', color: 'info' },
  { id: 34, code: 'REJECTED', displayName: 'Rejected', color: 'error' },
];

export const toOptions = (items) =>
  items.map(item => ({
    value: item.code,
    label: item.displayName,
    color: item.color,
    ...item
  }));

export const POD_STATUS_OPTIONS = toOptions(POD_STATUSES);
export const POD_STATUS_CONFIG = Object.fromEntries(
  POD_STATUSES.map(item => [item.code, item])
);
