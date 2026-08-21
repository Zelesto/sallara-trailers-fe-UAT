// src/constants/fuelEnums.js
export const FUEL_TYPES = [
  { id: 42, code: 'DIESEL_50', displayName: 'Diesel (50ppm)', description: 'Diesel fuel with 50ppm sulfur', sortOrder: 1, isDefault: true },
  { id: 43, code: 'DIESEL_10', displayName: 'Diesel (10ppm)', description: 'Diesel fuel with 10ppm sulfur', sortOrder: 2, isDefault: false },
  { id: 44, code: 'DIESEL_500', displayName: 'Diesel (500ppm)', description: 'Diesel fuel with 500ppm sulfur', sortOrder: 3, isDefault: false },
  { id: 45, code: 'PETROL_93', displayName: 'Petrol 93', description: 'Petrol 93 octane', sortOrder: 4, isDefault: false },
  { id: 46, code: 'PETROL_95', displayName: 'Petrol 95', description: 'Petrol 95 octane', sortOrder: 5, isDefault: false },
  { id: 47, code: 'LPG', displayName: 'LPG', description: 'Liquefied Petroleum Gas', sortOrder: 6, isDefault: false },
  { id: 48, code: 'BIOFUEL', displayName: 'Biofuel', description: 'Biofuel blend', sortOrder: 7, isDefault: false },
  { id: 49, code: 'HYDROGEN', displayName: 'Hydrogen', description: 'Hydrogen fuel', sortOrder: 8, isDefault: false },
];

export const PAYMENT_METHODS = [
  { id: 50, code: 'CASH', displayName: 'Cash', sortOrder: 1, isDefault: false },
  { id: 51, code: 'CREDIT_CARD', displayName: 'Credit Card', sortOrder: 2, isDefault: false },
  { id: 52, code: 'DEBIT_CARD', displayName: 'Debit Card', sortOrder: 3, isDefault: false },
  { id: 53, code: 'FLEET_CARD', displayName: 'Fleet Card', sortOrder: 4, isDefault: true },
  { id: 54, code: 'EFT', displayName: 'Electronic Transfer', sortOrder: 5, isDefault: false },
  { id: 55, code: 'ACCOUNT', displayName: 'Account Payment', sortOrder: 6, isDefault: false },
  { id: 56, code: 'PAYPAL', displayName: 'PayPal', sortOrder: 7, isDefault: false },
  { id: 57, code: 'STRIPE', displayName: 'Stripe', sortOrder: 8, isDefault: false },
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

export const FUEL_TYPE_OPTIONS = toOptions(FUEL_TYPES);
export const PAYMENT_METHOD_OPTIONS = toOptions(PAYMENT_METHODS);

export const FUEL_TYPE_CONFIG = Object.fromEntries(
  FUEL_TYPES.map(item => [item.code, item])
);

export const PAYMENT_METHOD_CONFIG = Object.fromEntries(
  PAYMENT_METHODS.map(item => [item.code, item])
);
