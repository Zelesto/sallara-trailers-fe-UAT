// src/services/enumService.js
import api from './api';

// Cache for enum data
let enumCache = {};
let enumCacheTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const enumService = {
    // ============================================================
    // READ OPERATIONS
    // ============================================================

    /**
     * Get enums by module and category
     * @param {string} moduleName - e.g., 'trip', 'vehicle', 'driver'
     * @param {string} category - e.g., 'status', 'type', 'approval'
     * @param {boolean} includeInactive - Include inactive enums
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
            const data = response.data?.data || [];
            
            // Cache the result
            enumCache[cacheKey] = data;
            enumCacheTime[cacheKey] = Date.now();
            
            return data;
        } catch (error) {
            console.error('Failed to fetch enums:', error);
            return [];
        }
    },

    /**
     * Get system enums
     */
    getSystemEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/system`);
            return response.data?.data || [];
        } catch (error) {
            console.error('Failed to fetch system enums:', error);
            return [];
        }
    },

    /**
     * Get custom enums
     */
    getCustomEnums: async (moduleName, category) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/custom`);
            return response.data?.data || [];
        } catch (error) {
            console.error('Failed to fetch custom enums:', error);
            return [];
        }
    },

    /**
     * Get all enums for a module
     */
    getEnumsByModule: async (moduleName) => {
        try {
            const response = await api.get(`/enums/module/${moduleName}`);
            return response.data?.data || {};
        } catch (error) {
            console.error('Failed to fetch enums by module:', error);
            return {};
        }
    },

    /**
     * Get enum by ID
     */
    getEnumById: async (id) => {
        try {
            const response = await api.get(`/enums/${id}`);
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to fetch enum:', error);
            return null;
        }
    },

    /**
     * Get enum by module, category, and code
     */
    getEnumByCode: async (moduleName, category, code) => {
        try {
            const response = await api.get(`/enums/${moduleName}/${category}/${code}`);
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to fetch enum:', error);
            return null;
        }
    },

    /**
     * Get all enum types (categories)
     */
    getEnumTypes: async () => {
        try {
            const response = await api.get('/enums/types');
            return response.data?.data || [];
        } catch (error) {
            console.error('Failed to fetch enum types:', error);
            return [];
        }
    },

    /**
     * Get all modules
     */
    getModules: async () => {
        try {
            const response = await api.get('/enums/modules');
            return response.data?.data || [];
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
     */
    createEnum: async (enumData) => {
        try {
            const response = await api.post('/enums', enumData);
            // Clear cache after creation
            enumService.clearCache();
            return response.data?.data || null;
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
     */
    updateEnum: async (id, enumData) => {
        try {
            const response = await api.put(`/enums/${id}`, enumData);
            // Clear cache after update
            enumService.clearCache();
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to update enum:', error);
            throw error;
        }
    },

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    /**
     * Delete an enum (soft delete)
     */
    deleteEnum: async (id) => {
        try {
            await api.delete(`/enums/${id}`);
            // Clear cache after delete
            enumService.clearCache();
            return true;
        } catch (error) {
            console.error('Failed to delete enum:', error);
            throw error;
        }
    },

    /**
     * Toggle enum active status
     */
    toggleEnumStatus: async (id) => {
        try {
            const response = await api.patch(`/enums/${id}/toggle`);
            // Clear cache after toggle
            enumService.clearCache();
            return response.data?.data || null;
        } catch (error) {
            console.error('Failed to toggle enum:', error);
            throw error;
        }
    },

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Map enum data to options format for select inputs
     */
    mapToOptions: (items) => {
        if (!items || !Array.isArray(items)) return [];
        return items.map(item => ({
            value: item.code,
            label: item.displayName || item.code,
            ...item
        }));
    },

    /**
     * Get enum display name by code
     */
    getDisplayName: (items, code) => {
        const found = items.find(item => item.code === code);
        return found?.displayName || code || 'Unknown';
    },

    /**
     * Get enum color by code
     */
    getColor: (items, code) => {
        const found = items.find(item => item.code === code);
        return found?.colorCode || '#9E9E9E';
    },

    /**
     * Get enum icon by code
     */
    getIcon: (items, code) => {
        const found = items.find(item => item.code === code);
        return found?.iconName || null;
    },

    /**
     * Clear enum cache
     */
    clearCache: () => {
        enumCache = {};
        enumCacheTime = {};
    }
};

export default enumService;
