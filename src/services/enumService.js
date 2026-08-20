// src/services/enumService.js
import api from './api';

// Cache for enum data
let enumCache = {};
let enumCacheTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const enumService = {
    /**
     * Get enums from the database
     * GET /api/enums/{moduleName}/{category}
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
            const response = await api.get(`/enums/${moduleName}/${category}`, {
                params: { includeInactive }
            });
            
            // The API returns: { success: true, data: [...], count: N }
            const data = response?.data?.data || [];
            
            if (!Array.isArray(data)) {
                console.warn(`⚠️ Expected array for ${moduleName}/${category}, got:`, data);
                return [];
            }
            
            // Cache the result
            enumCache[cacheKey] = data;
            enumCacheTime[cacheKey] = Date.now();
            
            return data;
        } catch (error) {
            console.error(`Failed to fetch enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get system enums
     * GET /api/enums/{moduleName}/{category}/system
     */
    getSystemEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/system`);
            return response?.data?.data || [];
        } catch (error) {
            console.error(`Failed to fetch system enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get custom enums
     * GET /api/enums/{moduleName}/{category}/custom
     */
    getCustomEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/custom`);
            return response?.data?.data || [];
        } catch (error) {
            console.error(`Failed to fetch custom enums for ${moduleName}/${category}:`, error);
            return [];
        }
    },

    /**
     * Get all enums for a module
     * GET /api/enums/module/{moduleName}
     */
    getEnumsByModule: async (moduleName) => {
        try {
            const response = await api.get(`/enums/module/${moduleName}`);
            return response?.data?.data || {};
        } catch (error) {
            console.error(`Failed to fetch enums by module ${moduleName}:`, error);
            return {};
        }
    },

    /**
     * Get enum by ID
     * GET /api/enums/{id}
     */
    getEnumById: async (id) => {
        try {
            const response = await api.get(`/enums/${id}`);
            return response?.data?.data || null;
        } catch (error) {
            console.error(`Failed to fetch enum ${id}:`, error);
            return null;
        }
    },

    /**
     * Get enum by module, category, and code
     * GET /api/enums/{moduleName}/{category}/{code}
     */
    getEnumByCode: async (moduleName, category, code) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/${code}`);
            return response?.data?.data || null;
        } catch (error) {
            console.error(`Failed to fetch enum ${moduleName}/${category}/${code}:`, error);
            return null;
        }
    },

    /**
     * Get all enum types (categories)
     * GET /api/enums/types
     */
    getEnumTypes: async () => {
        try {
            const response = await api.get('/enums/types');
            return response?.data?.data || [];
        } catch (error) {
            console.error('Failed to fetch enum types:', error);
            return [];
        }
    },

    /**
     * Get all modules
     * GET /api/enums/modules
     */
    getModules: async () => {
        try {
            const response = await api.get('/enums/modules');
            return response?.data?.data || [];
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
     * POST /api/enums
     */
    createEnum: async (enumData) => {
        try {
            const response = await api.post('/enums', enumData);
            enumService.clearCache();
            return response?.data?.data || null;
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
     * PUT /api/enums/{id}
     */
    updateEnum: async (id, enumData) => {
        try {
            const response = await api.put(`/enums/${id}`, enumData);
            enumService.clearCache();
            return response?.data?.data || null;
        } catch (error) {
            console.error(`Failed to update enum ${id}:`, error);
            throw error;
        }
    },

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Delete an enum (soft delete)
     * DELETE /api/enums/{id}
     */
    deleteEnum: async (id) => {
        try {
            await api.delete(`/enums/${id}`);
            enumService.clearCache();
            return true;
        } catch (error) {
            console.error(`Failed to delete enum ${id}:`, error);
            throw error;
        }
    },

    /**
     * Toggle enum active status
     * PATCH /api/enums/{id}/toggle
     */
    toggleEnumStatus: async (id) => {
        try {
            const response = await api.patch(`/enums/${id}/toggle`);
            enumService.clearCache();
            return response?.data?.data || null;
        } catch (error) {
            console.error(`Failed to toggle enum ${id}:`, error);
            throw error;
        }
    },

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Map enum data to options format for select inputs
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
     */
    mapEntityToOptions: (items, labelKey = 'name', valueKey = 'id') => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items
            .filter(item => item && typeof item === 'object')
            .map(item => ({
                value: item[valueKey] || item.id,
                label: item[labelKey] || item.name || item.fullName || item.registrationNumber || String(item.id || ''),
                ...item
            }));
    },

    /**
     * Get enum display name by code
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
     */
    getIcon: (items, code, defaultIcon = null) => {
        if (!items || !Array.isArray(items) || !code) {
            return defaultIcon;
        }
        const found = items.find(item => item.code === code || item.value === code);
        return found?.iconName || found?.icon || defaultIcon;
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
     */
    getCacheStats: () => {
        const keys = Object.keys(enumCache);
        return {
            size: keys.length,
            keys: keys,
            hasData: keys.length > 0,
        };
    }
};

export default enumService;
