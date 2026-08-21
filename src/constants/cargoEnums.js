// src/constants/cargoEnums.js
// Cargo/Commodity related enums from database

export const COMMODITY_TYPES = [
  { id: 139, code: 'GENERAL_FREIGHT', displayName: 'General Freight', description: 'General freight commodity', sortOrder: 1, isDefault: true, color: '#2196F3' },
  { id: 140, code: 'REFRIGERATED', displayName: 'Refrigerated', description: 'Refrigerated goods', sortOrder: 2, isDefault: false, color: '#4CAF50' },
  { id: 141, code: 'DANGEROUS_GOODS', displayName: 'Dangerous Goods', description: 'Dangerous goods commodity', sortOrder: 3, isDefault: false, color: '#F44336' },
  { id: 142, code: 'CHEMICALS', displayName: 'Chemicals', description: 'Chemical commodities', sortOrder: 4, isDefault: false, color: '#FF9800' },
  { id: 143, code: 'CONSTRUCTION', displayName: 'Construction', description: 'Construction materials', sortOrder: 5, isDefault: false, color: '#795548' },
  { id: 144, code: 'AGRICULTURAL', displayName: 'Agricultural', description: 'Agricultural products', sortOrder: 6, isDefault: false, color: '#8BC34A' },
  { id: 145, code: 'LIVESTOCK', displayName: 'Livestock', description: 'Livestock transport', sortOrder: 7, isDefault: false, color: '#795548' },
  { id: 146, code: 'AUTOMOTIVE', displayName: 'Automotive', description: 'Automotive parts', sortOrder: 8, isDefault: false, color: '#2196F3' },
  { id: 147, code: 'ELECTRONICS', displayName: 'Electronics', description: 'Electronic goods', sortOrder: 9, isDefault: false, color: '#9C27B0' },
  { id: 148, code: 'PHARMACEUTICALS', displayName: 'Pharmaceuticals', description: 'Pharmaceutical products', sortOrder: 10, isDefault: false, color: '#E91E63' },
  { id: 149, code: 'FOOD_PRODUCTS', displayName: 'Food Products', description: 'Food products', sortOrder: 11, isDefault: false, color: '#4CAF50' },
  { id: 150, code: 'BEVERAGES', displayName: 'Beverages', description: 'Beverages transport', sortOrder: 12, isDefault: false, color: '#00BCD4' },
  { id: 151, code: 'FUEL', displayName: 'Fuel', description: 'Fuel transport', sortOrder: 13, isDefault: false, color: '#FF5722' },
  { id: 152, code: 'WASTE', displayName: 'Waste', description: 'Waste materials', sortOrder: 14, isDefault: false, color: '#795548' },
];

export const PACKAGING_TYPES = [
  { id: 169, code: 'PALLET', displayName: 'Pallet', description: 'Pallet packaging', sortOrder: 1, isDefault: true },
  { id: 170, code: 'CRATE', displayName: 'Crate', description: 'Crate packaging', sortOrder: 2, isDefault: false },
  { id: 171, code: 'BOX', displayName: 'Box', description: 'Box packaging', sortOrder: 3, isDefault: false },
  { id: 172, code: 'BAG', displayName: 'Bag', description: 'Bag packaging', sortOrder: 4, isDefault: false },
  { id: 173, code: 'DRUM', displayName: 'Drum', description: 'Drum packaging', sortOrder: 5, isDefault: false },
  { id: 174, code: 'BULK', displayName: 'Bulk', description: 'Bulk packaging', sortOrder: 6, isDefault: false },
  { id: 175, code: 'CONTAINER', displayName: 'Container', description: 'Container packaging', sortOrder: 7, isDefault: false },
];

export const HAZARD_CLASSES = [
  { id: 183, code: 'CLASS_1', displayName: 'Class 1 - Explosives', description: 'Explosives hazard class', sortOrder: 1, isDefault: false, color: '#F44336' },
  { id: 184, code: 'CLASS_2', displayName: 'Class 2 - Gases', description: 'Gases hazard class', sortOrder: 2, isDefault: false, color: '#FF9800' },
  { id: 185, code: 'CLASS_3', displayName: 'Class 3 - Flammable Liquids', description: 'Flammable liquids hazard class', sortOrder: 3, isDefault: false, color: '#FF5722' },
  { id: 186, code: 'CLASS_4', displayName: 'Class 4 - Flammable Solids', description: 'Flammable solids hazard class', sortOrder: 4, isDefault: false, color: '#FF5722' },
  { id: 187, code: 'CLASS_5', displayName: 'Class 5 - Oxidizers', description: 'Oxidizers hazard class', sortOrder: 5, isDefault: false, color: '#FF9800' },
  { id: 188, code: 'CLASS_6', displayName: 'Class 6 - Toxic', description: 'Toxic materials hazard class', sortOrder: 6, isDefault: false, color: '#9C27B0' },
  { id: 189, code: 'CLASS_7', displayName: 'Class 7 - Radioactive', description: 'Radioactive materials hazard class', sortOrder: 7, isDefault: false, color: '#F44336' },
  { id: 190, code: 'CLASS_8', displayName: 'Class 8 - Corrosives', description: 'Corrosives hazard class', sortOrder: 8, isDefault: false, color: '#F44336' },
  { id: 191, code: 'CLASS_9', displayName: 'Class 9 - Miscellaneous', description: 'Miscellaneous hazard class', sortOrder: 9, isDefault: false, color: '#9E9E9E' },
];

export const TEMPERATURE_REQUIREMENTS = [
  { id: 196, code: 'AMBIENT', displayName: 'Ambient', description: 'Ambient temperature', sortOrder: 1, isDefault: true },
  { id: 197, code: 'REFRIGERATED', displayName: 'Refrigerated', description: 'Refrigerated (2-8°C)', sortOrder: 2, isDefault: false },
  { id: 198, code: 'FROZEN', displayName: 'Frozen', description: 'Frozen (-18°C)', sortOrder: 3, isDefault: false },
  { id: 199, code: 'CONTROLLED', displayName: 'Controlled', description: 'Temperature controlled', sortOrder: 4, isDefault: false },
  { id: 200, code: 'CRITICAL', displayName: 'Critical', description: 'Critical temperature control', sortOrder: 5, isDefault: false },
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

export const COMMODITY_OPTIONS = toOptions(COMMODITY_TYPES);
export const PACKAGING_OPTIONS = toOptions(PACKAGING_TYPES);
export const HAZARD_CLASS_OPTIONS = toOptions(HAZARD_CLASSES);
export const TEMPERATURE_OPTIONS = toOptions(TEMPERATURE_REQUIREMENTS);

export const COMMODITY_CONFIG = Object.fromEntries(
  COMMODITY_TYPES.map(item => [item.code, item])
);
