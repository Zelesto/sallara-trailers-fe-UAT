// src/constants/financeEnums.js
// Finance-related enums from database

export const PAYMENT_METHODS = [
  { id: 50, code: 'CASH', displayName: 'Cash', description: 'Cash payment', sortOrder: 1, isDefault: false },
  { id: 51, code: 'CREDIT_CARD', displayName: 'Credit Card', description: 'Credit card payment', sortOrder: 2, isDefault: false },
  { id: 52, code: 'DEBIT_CARD', displayName: 'Debit Card', description: 'Debit card payment', sortOrder: 3, isDefault: false },
  { id: 53, code: 'FLEET_CARD', displayName: 'Fleet Card', description: 'Fleet card payment', sortOrder: 4, isDefault: true },
  { id: 54, code: 'EFT', displayName: 'Electronic Transfer', description: 'Electronic funds transfer', sortOrder: 5, isDefault: false },
  { id: 55, code: 'ACCOUNT', displayName: 'Account Payment', description: 'Account payment', sortOrder: 6, isDefault: false },
  { id: 56, code: 'PAYPAL', displayName: 'PayPal', description: 'PayPal payment', sortOrder: 7, isDefault: false },
  { id: 57, code: 'STRIPE', displayName: 'Stripe', description: 'Stripe payment', sortOrder: 8, isDefault: false },
];

export const ACCOUNT_TYPES = [
  { id: 85, code: 'ASSET', displayName: 'Asset', description: 'Asset account type', sortOrder: 1, isDefault: false, color: '#2196F3', icon: 'Asset' },
  { id: 86, code: 'LIABILITY', displayName: 'Liability', description: 'Liability account type', sortOrder: 2, isDefault: false, color: '#FF9800', icon: 'Liability' },
  { id: 87, code: 'EQUITY', displayName: 'Equity', description: 'Equity account type', sortOrder: 3, isDefault: false, color: '#9C27B0', icon: 'Equity' },
  { id: 88, code: 'REVENUE', displayName: 'Revenue', description: 'Revenue account type', sortOrder: 4, isDefault: false, color: '#4CAF50', icon: 'Revenue' },
  { id: 89, code: 'EXPENSE', displayName: 'Expense', description: 'Expense account type', sortOrder: 5, isDefault: false, color: '#F44336', icon: 'Expense' },
  { id: 90, code: 'FUEL', displayName: 'Fuel', description: 'Fuel account type', sortOrder: 6, isDefault: false, color: '#FF5722', icon: 'Fuel' },
];

export const PAYMENT_STATUSES = [
  { id: 91, code: 'PENDING', displayName: 'Pending', description: 'Payment is pending', sortOrder: 1, isDefault: true, color: '#FF9800' },
  { id: 92, code: 'PAID', displayName: 'Paid', description: 'Payment has been completed', sortOrder: 2, isDefault: false, color: '#4CAF50' },
  { id: 93, code: 'FAILED', displayName: 'Failed', description: 'Payment has failed', sortOrder: 3, isDefault: false, color: '#F44336' },
  { id: 94, code: 'REFUNDED', displayName: 'Refunded', description: 'Payment has been refunded', sortOrder: 4, isDefault: false, color: '#9E9E9E' },
  { id: 95, code: 'CANCELLED', displayName: 'Cancelled', description: 'Payment has been cancelled', sortOrder: 5, isDefault: false, color: '#F44336' },
  { id: 96, code: 'PARTIALLY_PAID', displayName: 'Partially Paid', description: 'Payment is partially paid', sortOrder: 6, isDefault: false, color: '#FF5722' },
];

export const RECONCILIATION_STATUSES = [
  { id: 97, code: 'PENDING', displayName: 'Pending', description: 'Reconciliation is pending', sortOrder: 1, isDefault: true, color: '#FF9800' },
  { id: 98, code: 'IN_PROGRESS', displayName: 'In Progress', description: 'Reconciliation is in progress', sortOrder: 2, isDefault: false, color: '#2196F3' },
  { id: 99, code: 'COMPLETED', displayName: 'Completed', description: 'Reconciliation has been completed', sortOrder: 3, isDefault: false, color: '#4CAF50' },
  { id: 100, code: 'FAILED', displayName: 'Failed', description: 'Reconciliation has failed', sortOrder: 4, isDefault: false, color: '#F44336' },
  { id: 101, code: 'CANCELLED', displayName: 'Cancelled', description: 'Reconciliation has been cancelled', sortOrder: 5, isDefault: false, color: '#9E9E9E' },
];

// ============================================================
// ✅ INVOICE ENUMS (from database data)
// ============================================================
export const INVOICE_TYPES = [
  { code: 'RECEIVABLE', displayName: 'Accounts Receivable', description: 'Money owed to you', color: '#22C55E', sortOrder: 1, isDefault: true },
  { code: 'PAYABLE', displayName: 'Accounts Payable', description: 'Money you owe others', color: '#EF4444', sortOrder: 2, isDefault: false },
];

export const INVOICE_STATUSES = [
  { code: 'DRAFT', displayName: 'Draft', description: 'Initial draft state', color: '#9E9E9E', sortOrder: 1, isDefault: false },
  { code: 'SENT', displayName: 'Sent', description: 'Invoice has been sent', color: '#3B82F6', sortOrder: 2, isDefault: false },
  { code: 'VIEWED', displayName: 'Viewed', description: 'Invoice has been viewed', color: '#8B5CF6', sortOrder: 3, isDefault: false },
  { code: 'PARTIAL', displayName: 'Partially Paid', description: 'Partially paid', color: '#F59E0B', sortOrder: 4, isDefault: false },
  { code: 'PAID', displayName: 'Paid', description: 'Invoice has been paid', color: '#22C55E', sortOrder: 5, isDefault: false },
  { code: 'OVERDUE', displayName: 'Overdue', description: 'Invoice is overdue', color: '#EF4444', sortOrder: 6, isDefault: false },
  { code: 'CANCELLED', displayName: 'Cancelled', description: 'Invoice has been cancelled', color: '#6B7280', sortOrder: 7, isDefault: false },
];

// ============================================================
// ✅ INVOICE ITEM ENUMS (for line items)
// ============================================================
export const INVOICE_ITEM_TYPES = [
  { code: 'PRODUCT', displayName: 'Product', sortOrder: 1, isDefault: true },
  { code: 'SERVICE', displayName: 'Service', sortOrder: 2, isDefault: false },
  { code: 'LABOR', displayName: 'Labor', sortOrder: 3, isDefault: false },
  { code: 'SHIPPING', displayName: 'Shipping', sortOrder: 4, isDefault: false },
  { code: 'TAX', displayName: 'Tax', sortOrder: 5, isDefault: false },
  { code: 'DISCOUNT', displayName: 'Discount', sortOrder: 6, isDefault: false },
];

export const INVOICE_TAX_RATES = [
  { code: 'VAT_0', displayName: '0% VAT', rate: 0, sortOrder: 1, isDefault: false },
  { code: 'VAT_15', displayName: '15% VAT', rate: 15, sortOrder: 2, isDefault: true },
  { code: 'VAT_EXEMPT', displayName: 'VAT Exempt', rate: 0, sortOrder: 3, isDefault: false },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
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

// Options
export const PAYMENT_METHOD_OPTIONS = toOptions(PAYMENT_METHODS);
export const ACCOUNT_TYPE_OPTIONS = toOptions(ACCOUNT_TYPES);
export const PAYMENT_STATUS_OPTIONS = toOptions(PAYMENT_STATUSES);
export const RECONCILIATION_STATUS_OPTIONS = toOptions(RECONCILIATION_STATUSES);

// ✅ Invoice Options
export const INVOICE_TYPE_OPTIONS = toOptions(INVOICE_TYPES);
export const INVOICE_STATUS_OPTIONS = toOptions(INVOICE_STATUSES);
export const INVOICE_ITEM_TYPE_OPTIONS = toOptions(INVOICE_ITEM_TYPES);
export const INVOICE_TAX_RATE_OPTIONS = toOptions(INVOICE_TAX_RATES);

// ✅ Config Maps for lookups
export const PAYMENT_METHOD_CONFIG = Object.fromEntries(
  PAYMENT_METHODS.map(item => [item.code, item])
);

export const INVOICE_TYPE_CONFIG = Object.fromEntries(
  INVOICE_TYPES.map(item => [item.code, item])
);

export const INVOICE_STATUS_CONFIG = Object.fromEntries(
  INVOICE_STATUSES.map(item => [item.code, item])
);

export const INVOICE_ITEM_TYPE_CONFIG = Object.fromEntries(
  INVOICE_ITEM_TYPES.map(item => [item.code, item])
);

export const INVOICE_TAX_RATE_CONFIG = Object.fromEntries(
  INVOICE_TAX_RATES.map(item => [item.code, item])
);
