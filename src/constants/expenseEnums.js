// src/constants/expenseEnums.js
// Expense-related enums from database

export const EXPENSE_CATEGORIES = [
  { code: 'FUEL', displayName: 'Fuel', color: '#FF9800' },
  { code: 'MAINTENANCE', displayName: 'Vehicle Maintenance', color: '#2196F3' },
  { code: 'REPAIRS', displayName: 'Repairs', color: '#F44336' },
  { code: 'INSURANCE', displayName: 'Insurance', color: '#4CAF50' },
  { code: 'LICENSING', displayName: 'Licensing & Permits', color: '#9C27B0' },
  { code: 'TOLLS', displayName: 'Tolls & Fees', color: '#FF5722' },
  { code: 'ACCOMMODATION', displayName: 'Accommodation', color: '#795548' },
  { code: 'MEALS', displayName: 'Meals & Entertainment', color: '#E91E63' },
  { code: 'SALARIES', displayName: 'Salaries & Wages', color: '#3F51B5' },
  { code: 'OFFICE', displayName: 'Office Supplies', color: '#607D8B' },
  { code: 'UTILITIES', displayName: 'Utilities', color: '#00BCD4' },
  { code: 'OTHER', displayName: 'Other', color: '#9E9E9E' },
];

export const toOptions = (items) =>
  items.map(item => ({
    value: item.code,
    label: item.displayName,
    color: item.color,
    ...item
  }));

export const EXPENSE_CATEGORY_OPTIONS = toOptions(EXPENSE_CATEGORIES);

export const EXPENSE_CATEGORY_CONFIG = Object.fromEntries(
  EXPENSE_CATEGORIES.map(item => [item.code, item])
);
