// src/constants/customerEnums.js
// Customer-related enums

export const PAYMENT_TERMS = [
  { code: 'ON_DELIVERY', displayName: 'On Delivery', sortOrder: 1 },
  { code: '7_DAYS', displayName: '7 Days', sortOrder: 2 },
  { code: '14_DAYS', displayName: '14 Days', sortOrder: 3 },
  { code: '21_DAYS', displayName: '21 Days', sortOrder: 4 },
  { code: '30_DAYS', displayName: '30 Days', sortOrder: 5, isDefault: true },
  { code: '45_DAYS', displayName: '45 Days', sortOrder: 6 },
  { code: '60_DAYS', displayName: '60 Days', sortOrder: 7 },
  { code: 'END_OF_MONTH', displayName: 'End of Month', sortOrder: 8 },
];

export const CURRENCIES = [
  { code: 'ZAR', displayName: 'ZAR - South African Rand', sortOrder: 1, isDefault: true },
  { code: 'USD', displayName: 'USD - US Dollar', sortOrder: 2 },
  { code: 'EUR', displayName: 'EUR - Euro', sortOrder: 3 },
  { code: 'GBP', displayName: 'GBP - British Pound', sortOrder: 4 },
  { code: 'BWP', displayName: 'BWP - Botswana Pula', sortOrder: 5 },
  { code: 'NAD', displayName: 'NAD - Namibian Dollar', sortOrder: 6 },
  { code: 'SZL', displayName: 'SZL - Swazi Lilangeni', sortOrder: 7 },
  { code: 'MZN', displayName: 'MZN - Mozambican Metical', sortOrder: 8 },
];

export const CUSTOMER_TYPES = [
  { code: 'COMPANY', displayName: 'Company', sortOrder: 1, isDefault: true },
  { code: 'INDIVIDUAL', displayName: 'Individual', sortOrder: 2 },
  { code: 'GOVERNMENT', displayName: 'Government', sortOrder: 3 },
  { code: 'NON_PROFIT', displayName: 'Non-Profit', sortOrder: 4 },
  { code: 'PARTNERSHIP', displayName: 'Partnership', sortOrder: 5 },
  { code: 'SOLE_PROPRIETOR', displayName: 'Sole Proprietor', sortOrder: 6 },
];

export const INDUSTRY_TYPES = [
  { code: 'LOGISTICS', displayName: 'Logistics & Transportation', sortOrder: 1, isDefault: true },
  { code: 'RETAIL', displayName: 'Retail', sortOrder: 2 },
  { code: 'MANUFACTURING', displayName: 'Manufacturing', sortOrder: 3 },
  { code: 'AGRICULTURE', displayName: 'Agriculture', sortOrder: 4 },
  { code: 'CONSTRUCTION', displayName: 'Construction', sortOrder: 5 },
  { code: 'MINING', displayName: 'Mining', sortOrder: 6 },
  { code: 'OIL_GAS', displayName: 'Oil & Gas', sortOrder: 7 },
  { code: 'PHARMACEUTICAL', displayName: 'Pharmaceutical', sortOrder: 8 },
  { code: 'FOOD_BEVERAGE', displayName: 'Food & Beverage', sortOrder: 9 },
  { code: 'AUTOMOTIVE', displayName: 'Automotive', sortOrder: 10 },
  { code: 'TECHNOLOGY', displayName: 'Technology', sortOrder: 11 },
  { code: 'FINANCE', displayName: 'Finance & Banking', sortOrder: 12 },
  { code: 'HEALTHCARE', displayName: 'Healthcare', sortOrder: 13 },
  { code: 'EDUCATION', displayName: 'Education', sortOrder: 14 },
  { code: 'GOVERNMENT', displayName: 'Government', sortOrder: 15 },
  { code: 'NON_PROFIT', displayName: 'Non-Profit', sortOrder: 16 },
  { code: 'OTHER', displayName: 'Other', sortOrder: 17 },
];

// Helper to convert to options format
export const toOptions = (items) =>
  items.map(item => ({
    value: item.code,
    label: item.displayName,
    isDefault: item.isDefault,
    sortOrder: item.sortOrder,
    ...item
  }));
