// src/services/enumService.js
import api from './api';

// Cache for enum data
let enumCache = {};
let enumCacheTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const enumService = {
    /**
     * Get enums from the database
     * @param {string} moduleName - The module name (e.g., 'trip', 'load', 'vehicle')
     * @param {string} category - The category (e.g., 'status', 'type', 'priority')
     * @param {boolean} includeInactive - Whether to include inactive enums
     * @returns {Promise<Array>} Array of enum items
     */
    getEnums: async (moduleName, category, includeInactive = false) => {
        const cacheKey = `${moduleName}:${category}:${includeInactive}`;
        
        // Check cache
        if (enumCache[cacheKey] && enumCacheTime[cacheKey]) {
            const now = Date.now();
            if (now - enumCacheTime[cacheKey] < CACHE_DURATION) {
                return enumCache[cacheKey];
            }
        }

        try {
            // Add timestamp to prevent caching issues
            const timestamp = Date.now();
            const response = await api.get(`/enums/${moduleName}/${category}`, {
                params: { includeInactive, _t: timestamp }
            });
            
            // Handle different response formats
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                } else if (response.data.items && Array.isArray(response.data.items)) {
                    data = response.data.items;
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    data = response.data.results;
                } else {
                    // Try to extract any array from the response
                    const values = Object.values(response.data);
                    const arrayValue = values.find(v => Array.isArray(v));
                    if (arrayValue) {
                        data = arrayValue;
                    }
                }
            }
            
            // Ensure we have an array
            if (!Array.isArray(data)) {
                data = [];
            }
            
            // Cache the result
            enumCache[cacheKey] = data;
            enumCacheTime[cacheKey] = Date.now();
            
            return data;
        } catch (error) {
            // If 401, re-throw so the context can handle it
            if (error.response?.status === 401) {
                console.warn(`⚠️ Auth required for enums: ${moduleName}/${category}`);
                throw error;
            }
            console.error(`Failed to fetch enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get system enums (non-editable)
     * @param {string} moduleName - The module name
     * @param {string} category - The category
     * @returns {Promise<Array>} Array of system enum items
     */
    getSystemEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/system`);
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                } else {
                    const values = Object.values(response.data);
                    const arrayValue = values.find(v => Array.isArray(v));
                    if (arrayValue) {
                        data = arrayValue;
                    }
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Failed to fetch system enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get custom enums (user-defined)
     * @param {string} moduleName - The module name
     * @param {string} category - The category
     * @returns {Promise<Array>} Array of custom enum items
     */
    getCustomEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/custom`);
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                } else {
                    const values = Object.values(response.data);
                    const arrayValue = values.find(v => Array.isArray(v));
                    if (arrayValue) {
                        data = arrayValue;
                    }
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Failed to fetch custom enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get all enums for a module grouped by category
     * @param {string} moduleName - The module name
     * @returns {Promise<Object>} Object with categories as keys and arrays as values
     */
    getEnumsByModule: async (moduleName) => {
        try {
            const response = await api.get(`/enums/module/${moduleName}`);
            
            let data = {};
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                } else if (response.data.content && typeof response.data.content === 'object') {
                    data = response.data.content;
                }
            }
            
            // Ensure each value is an array
            Object.keys(data).forEach(key => {
                if (!Array.isArray(data[key])) {
                    data[key] = [];
                }
            });
            
            return data;
        } catch (error) {
            console.error(`Failed to fetch enums by module ${moduleName}:`, error);
            return {};
        }
    },

    /**
     * Get enum by ID
     * @param {number|string} id - The enum ID
     * @returns {Promise<Object|null>} Enum object or null
     */
    getEnumById: async (id) => {
        try {
            const response = await api.get(`/enums/${id}`);
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error(`Failed to fetch enum ${id}:`, error);
            return null;
        }
    },

    /**
     * Get enum by module, category, and code
     * @param {string} moduleName - The module name
     * @param {string} category - The category
     * @param {string} code - The enum code
     * @returns {Promise<Object|null>} Enum object or null
     */
    getEnumByCode: async (moduleName, category, code) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/${code}`);
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error(`Failed to fetch enum ${moduleName}/${category}/${code}:`, error);
            return null;
        }
    },

    /**
     * Get all enum types (categories)
     * @returns {Promise<Array>} Array of category names
     */
    getEnumTypes: async () => {
        try {
            const response = await api.get('/enums/types');
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                } else if (response.data.types && Array.isArray(response.data.types)) {
                    data = response.data.types;
                } else if (response.data.categories && Array.isArray(response.data.categories)) {
                    data = response.data.categories;
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to fetch enum types:', error);
            return [];
        }
    },

    /**
     * Get all modules
     * @returns {Promise<Array>} Array of module names
     */
    getModules: async () => {
        try {
            const response = await api.get('/enums/modules');
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                } else if (response.data.modules && Array.isArray(response.data.modules)) {
                    data = response.data.modules;
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to fetch modules:', error);
            return [];
        }
    },

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    /**
     * Create a new custom enum
     * @param {Object} enumData - The enum data
     * @param {string} enumData.moduleName - Module name
     * @param {string} enumData.category - Category
     * @param {string} enumData.code - Unique code
     * @param {string} enumData.displayName - Display name
     * @param {string} [enumData.description] - Description
     * @param {number} [enumData.sortOrder] - Sort order
     * @param {boolean} [enumData.isDefault] - Is default
     * @param {string} [enumData.colorCode] - Color code
     * @param {string} [enumData.iconName] - Icon name
     * @param {Object} [enumData.metadata] - Additional metadata
     * @returns {Promise<Object|null>} Created enum or null
     */
    createEnum: async (enumData) => {
        try {
            const response = await api.post('/enums', enumData);
            
            // Clear cache after creation
            enumService.clearCache();
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error('Failed to create enum:', error);
            throw error;
        }
    },

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    /**
     * Update an existing enum
     * @param {number|string} id - The enum ID
     * @param {Object} enumData - Updated enum data
     * @returns {Promise<Object|null>} Updated enum or null
     */
    updateEnum: async (id, enumData) => {
        try {
            const response = await api.put(`/enums/${id}`, enumData);
            
            // Clear cache after update
            enumService.clearCache();
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error(`Failed to update enum ${id}:`, error);
            throw error;
        }
    },

    /**
     * Partially update an enum
     * @param {number|string} id - The enum ID
     * @param {Object} enumData - Partial enum data to update
     * @returns {Promise<Object|null>} Updated enum or null
     */
    patchEnum: async (id, enumData) => {
        try {
            const response = await api.patch(`/enums/${id}`, enumData);
            
            // Clear cache after update
            enumService.clearCache();
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error(`Failed to patch enum ${id}:`, error);
            throw error;
        }
    },

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Delete an enum (soft delete)
     * @param {number|string} id - The enum ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    deleteEnum: async (id) => {
        try {
            await api.delete(`/enums/${id}`);
            
            // Clear cache after delete
            enumService.clearCache();
            return true;
        } catch (error) {
            console.error(`Failed to delete enum ${id}:`, error);
            throw error;
        }
    },

    /**
     * Permanently delete an enum (hard delete)
     * @param {number|string} id - The enum ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    hardDeleteEnum: async (id) => {
        try {
            await api.delete(`/enums/${id}/permanent`);
            
            // Clear cache after delete
            enumService.clearCache();
            return true;
        } catch (error) {
            console.error(`Failed to hard delete enum ${id}:`, error);
            throw error;
        }
    },

    /**
     * Toggle enum active status
     * @param {number|string} id - The enum ID
     * @returns {Promise<Object|null>} Updated enum or null
     */
    toggleEnumStatus: async (id) => {
        try {
            const response = await api.patch(`/enums/${id}/toggle`);
            
            // Clear cache after toggle
            enumService.clearCache();
            
            let data = null;
            if (response?.data) {
                if (typeof response.data === 'object' && !Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && typeof response.data.data === 'object') {
                    data = response.data.data;
                }
            }
            return data;
        } catch (error) {
            console.error(`Failed to toggle enum ${id}:`, error);
            throw error;
        }
    },

    // ============================================================
    // BULK OPERATIONS
    // ============================================================

    /**
     * Bulk create enums
     * @param {Array} enumDataArray - Array of enum data objects
     * @returns {Promise<Array>} Array of created enums
     */
    bulkCreateEnums: async (enumDataArray) => {
        try {
            const response = await api.post('/enums/bulk', enumDataArray);
            
            // Clear cache after creation
            enumService.clearCache();
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to bulk create enums:', error);
            throw error;
        }
    },

    /**
     * Bulk update enums
     * @param {Array} enumDataArray - Array of enum data objects with IDs
     * @returns {Promise<Array>} Array of updated enums
     */
    bulkUpdateEnums: async (enumDataArray) => {
        try {
            const response = await api.put('/enums/bulk', enumDataArray);
            
            // Clear cache after update
            enumService.clearCache();
            
            let data = [];
            if (response?.data) {
                if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = response.data.data;
                } else if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data.content;
                }
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Failed to bulk update enums:', error);
            throw error;
        }
    },

    /**
     * Bulk delete enums
     * @param {Array} ids - Array of enum IDs
     * @returns {Promise<boolean>} True if deleted successfully
     */
    bulkDeleteEnums: async (ids) => {
        try {
            await api.delete('/enums/bulk', { data: { ids } });
            
            // Clear cache after delete
            enumService.clearCache();
            return true;
        } catch (error) {
            console.error('Failed to bulk delete enums:', error);
            throw error;
        }
    },

    // ============================================================
    // SEARCH & FILTER OPERATIONS
    // ============================================================

    /**
     * Search enums
     * @param {Object} params - Search parameters
     * @param {string} [params.moduleName] - Filter by module
     * @param {string} [params.category] - Filter by category
     * @param {string} [params.search] - Search term
     * @param {boolean} [params.includeInactive] - Include inactive enums
     * @param {number} [params.page] - Page number
     * @param {number} [params.size] - Page size
     * @param {string} [params.sort] - Sort field
     * @param {string} [params.direction] - Sort direction
     * @returns {Promise<Object>} Search results with pagination
     */
    searchEnums: async (params = {}) => {
        try {
            const response = await api.get('/enums/search', { params });
            
            let data = { content: [], totalElements: 0, totalPages: 0 };
            if (response?.data) {
                if (response.data.content && Array.isArray(response.data.content)) {
                    data = response.data;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    data = { content: response.data.data, totalElements: response.data.total || response.data.data.length };
                } else if (Array.isArray(response.data)) {
                    data = { content: response.data, totalElements: response.data.length };
                }
            }
            return data;
        } catch (error) {
            console.error('Failed to search enums:', error);
            return { content: [], totalElements: 0, totalPages: 0 };
        }
    },

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Map enum data to options format for select inputs
     * @param {Array} items - Array of enum items
     * @param {string} [valueKey='code'] - Key to use for value
     * @param {string} [labelKey='displayName'] - Key to use for label
     * @returns {Array} Array of options {value, label, ...item}
     */
    mapToOptions: (items, valueKey = 'code', labelKey = 'displayName') => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                value: item[valueKey] || item.id || item.code || '',
                label: item[labelKey] || item.displayName || item.name || item.code || 'Unknown',
                ...item
            }));
    },

    /**
     * Map entity data to options format
     * @param {Array} items - Array of entity items
     * @param {string} [labelKey='name'] - Key to use for label
     * @param {string} [valueKey='id'] - Key to use for value
     * @returns {Array} Array of options {value, label, ...item}
     */
    mapEntityToOptions: (items, labelKey = 'name', valueKey = 'id') => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                value: item[valueKey] || item.id,
                label: item[labelKey] || item.name || item.fullName || item.registrationNumber || String(item.id),
                ...item
            }));
    },

    /**
     * Get enum display name by code
     * @param {Array} items - Array of enum items
     * @param {string} code - The enum code
     * @param {string} [defaultValue] - Default value if not found
     * @returns {string} Display name or default
     */
    getDisplayName: (items, code, defaultValue = null) => {
        if (!items || !Array.isArray(items) || !code) {
            return defaultValue || code || 'Unknown';
        }
        const found = items.find(item => item.code === code || item.value === code);
        return found?.displayName || found?.label || defaultValue || code || 'Unknown';
    },

    /**
     * Get enum color by code
     * @param {Array} items - Array of enum items
     * @param {string} code - The enum code
     * @param {string} [defaultColor='#9E9E9E'] - Default color
     * @returns {string} Color code
     */
    getColor: (items, code, defaultColor = '#9E9E9E') => {
        if (!items || !Array.isArray(items) || !code) {
            return defaultColor;
        }
        const found = items.find(item => item.code === code || item.value === code);
        return found?.colorCode || found?.color || defaultColor;
    },

    /**
     * Get enum icon by code
     * @param {Array} items - Array of enum items
     * @param {string} code - The enum code
     * @param {string} [defaultIcon=null] - Default icon
     * @returns {string|null} Icon name
     */
    getIcon: (items, code, defaultIcon = null) => {
        if (!items || !Array.isArray(items) || !code) {
            return defaultIcon;
        }
        const found = items.find(item => item.code === code || item.value === code);
        return found?.iconName || found?.icon || defaultIcon;
    },

    /**
     * Get enum by code
     * @param {Array} items - Array of enum items
     * @param {string} code - The enum code
     * @returns {Object|null} Enum item or null
     */
    getEnumByCodeFromList: (items, code) => {
        if (!items || !Array.isArray(items) || !code) {
            return null;
        }
        return items.find(item => item.code === code || item.value === code) || null;
    },

    /**
     * Get default enum from list
     * @param {Array} items - Array of enum items
     * @param {string} [fallback] - Fallback value if no default found
     * @returns {Object|null} Default enum item or null
     */
    getDefaultEnum: (items, fallback = null) => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return fallback;
        }
        const found = items.find(item => item.isDefault === true);
        return found || items[0] || fallback;
    },

    /**
     * Get default enum value
     * @param {Array} items - Array of enum items
     * @param {string} [fallback] - Fallback value if no default found
     * @returns {string} Default value
     */
    getDefaultValue: (items, fallback = null) => {
        const defaultEnum = enumService.getDefaultEnum(items);
        return defaultEnum?.code || defaultEnum?.value || fallback || '';
    },

    /**
     * Check if enum exists
     * @param {Array} items - Array of enum items
     * @param {string} code - The enum code
     * @returns {boolean} True if exists
     */
    enumExists: (items, code) => {
        if (!items || !Array.isArray(items) || !code) {
            return false;
        }
        return items.some(item => item.code === code || item.value === code);
    },

    /**
     * Get active enums
     * @param {Array} items - Array of enum items
     * @returns {Array} Active enum items
     */
    getActiveEnums: (items) => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.filter(item => item.isActive !== false);
    },

    /**
     * Get inactive enums
     * @param {Array} items - Array of enum items
     * @returns {Array} Inactive enum items
     */
    getInactiveEnums: (items) => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.filter(item => item.isActive === false);
    },

    /**
     * Get sorted enums by sort order
     * @param {Array} items - Array of enum items
     * @param {string} [direction='asc'] - Sort direction
     * @returns {Array} Sorted enum items
     */
    getSortedEnums: (items, direction = 'asc') => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        const sorted = [...items].sort((a, b) => {
            const orderA = a.sortOrder || 0;
            const orderB = b.sortOrder || 0;
            return direction === 'asc' ? orderA - orderB : orderB - orderA;
        });
        return sorted;
    },

    /**
     * Group enums by category
     * @param {Array} items - Array of enum items
     * @returns {Object} Grouped enums
     */
    groupByCategory: (items) => {
        if (!items || !Array.isArray(items)) {
            return {};
        }
        return items.reduce((acc, item) => {
            const category = item.category || 'uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {});
    },

    /**
     * Group enums by module
     * @param {Array} items - Array of enum items
     * @returns {Object} Grouped enums
     */
    groupByModule: (items) => {
        if (!items || !Array.isArray(items)) {
            return {};
        }
        return items.reduce((acc, item) => {
            const module = item.moduleName || 'unknown';
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(item);
            return acc;
        }, {});
    },

    /**
     * Clear enum cache
     */
    clearCache: () => {
        enumCache = {};
        enumCacheTime = {};
        console.log('🗑️ Enum cache cleared');
    },

    /**
     * Get cache stats
     * @returns {Object} Cache statistics
     */
    getCacheStats: () => {
        const keys = Object.keys(enumCache);
        return {
            size: keys.length,
            keys: keys,
            hasData: keys.length > 0,
        };
    },

    /**
     * Preload commonly used enums
     * @param {Array} enumConfigs - Array of {moduleName, category} objects
     * @returns {Promise<Object>} Map of loaded enums
     */
    preloadEnums: async (enumConfigs = []) => {
        const defaultConfigs = [
            { moduleName: 'trip', category: 'status' },
            { moduleName: 'trip', category: 'type' },
            { moduleName: 'trip', category: 'approval' },
            { moduleName: 'trip', category: 'priority' },
            { moduleName: 'load', category: 'status' },
            { moduleName: 'vehicle', category: 'status' },
            { moduleName: 'driver', category: 'status' },
        ];
        
        const configs = enumConfigs.length > 0 ? enumConfigs : defaultConfigs;
        
        try {
            const results = await Promise.allSettled(
                configs.map(({ moduleName, category }) =>
                    enumService.getEnums(moduleName, category)
                )
            );
            
            const resultMap = {};
            configs.forEach(({ moduleName, category }, index) => {
                const key = `${moduleName}:${category}`;
                if (results[index].status === 'fulfilled') {
                    resultMap[key] = results[index].value || [];
                } else {
                    resultMap[key] = [];
                    console.warn(`Failed to preload ${key}:`, results[index].reason);
                }
            });
            
            return resultMap;
        } catch (error) {
            console.error('Failed to preload enums:', error);
            return {};
        }
    }
};

export default enumService;
