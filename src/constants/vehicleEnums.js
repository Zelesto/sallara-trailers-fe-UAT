// src/constants/vehicleEnums.js
// Vehicle-related enums from database

export const VEHICLE_STATUSES = [
  { id: 25, code: 'AVAILABLE', displayName: 'Available', description: 'Vehicle is available', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 26, code: 'ASSIGNED', displayName: 'Assigned', description: 'Vehicle is assigned', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 27, code: 'IN_TRIP', displayName: 'In Trip', description: 'Vehicle is on a trip', sortOrder: 3, isDefault: false, color: '#2196F3' },
  { id: 28, code: 'MAINTENANCE', displayName: 'Maintenance', description: 'Vehicle is in maintenance', sortOrder: 4, isDefault: false, color: '#FF5722' },
  { id: 29, code: 'OUT_OF_SERVICE', displayName: 'Out of Service', description: 'Vehicle is out of service', sortOrder: 5, isDefault: false, color: '#F44336' },
];

export const VEHICLE_TYPES = [
  { id: 105, code: 'TRUCK', displayName: 'Truck', description: 'Truck vehicle type', sortOrder: 1, isDefault: true, color: '#4CAF50' },
  { id: 106, code: 'TRAILER', displayName: 'Trailer', description: 'Trailer vehicle type', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 107, code: 'VAN', displayName: 'Van', description: 'Van vehicle type', sortOrder: 3, isDefault: false, color: '#2196F3' },
  { id: 108, code: 'CAR', displayName: 'Car', description: 'Car vehicle type', sortOrder: 4, isDefault: false, color: '#9C27B0' },
  { id: 109, code: 'MOTORCYCLE', displayName: 'Motorcycle', description: 'Motorcycle vehicle type', sortOrder: 5, isDefault: false, color: '#FF5722' },
];

export const FUEL_TANK_TYPES = [
  { id: 58, code: 'SINGLE', displayName: 'Single Tank', description: 'Single fuel tank', sortOrder: 1, isDefault: true },
  { id: 59, code: 'DUAL', displayName: 'Dual Tank', description: 'Dual fuel tanks', sortOrder: 2, isDefault: false },
  { id: 60, code: 'AUXILIARY', displayName: 'Auxiliary', description: 'Auxiliary fuel tank', sortOrder: 3, isDefault: false },
];

export const MAINTENANCE_STATUSES = [
  { id: 201, code: 'SCHEDULED', displayName: 'Scheduled', description: 'Maintenance scheduled', sortOrder: 1, isDefault: false, color: '#2196F3' },
  { id: 202, code: 'IN_PROGRESS', displayName: 'In Progress', description: 'Maintenance in progress', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 203, code: 'COMPLETED', displayName: 'Completed', description: 'Maintenance completed', sortOrder: 3, isDefault: false, color: '#4CAF50' },
  { id: 204, code: 'OVERDUE', displayName: 'Overdue', description: 'Maintenance overdue', sortOrder: 4, isDefault: false, color: '#F44336' },
];

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

export const VEHICLE_STATUS_OPTIONS = toOptions(VEHICLE_STATUSES);
export const VEHICLE_TYPE_OPTIONS = toOptions(VEHICLE_TYPES);
export const FUEL_TANK_TYPE_OPTIONS = toOptions(FUEL_TANK_TYPES);
export const MAINTENANCE_STATUS_OPTIONS = toOptions(MAINTENANCE_STATUSES);
export const FUEL_TYPE_OPTIONS = toOptions(FUEL_TYPES);

export const VEHICLE_STATUS_CONFIG = Object.fromEntries(
  VEHICLE_STATUSES.map(item => [item.code, item])
);
