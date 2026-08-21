// src/services/enumService.js
// This file is now deprecated - enums are loaded from constants
// Keep only if needed for other purposes

export const enumService = {
  // These methods now just return empty arrays or use hardcoded values
  getEnums: async () => {
    console.warn('enumService.getEnums is deprecated - enums are loaded from constants');
    return [];
  },
  
  // Keep for compatibility if needed
  clearCache: () => {},
  getCacheStats: () => ({ size: 0, keys: [], hasData: false }),
};

export default enumService;
