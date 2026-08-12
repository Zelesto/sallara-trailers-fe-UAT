// src/services/enumService.js
import api from './api';

// Cache for enum data
let enumCache = {};
let enumCacheTime = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const enumService = {
    /**
     * Get enums from the database
     */
    getEnums: async (moduleName, category, forceRefresh = false) => {
        const cacheKey = `${moduleName}:${category}`;
        
        // Check cache
        if (!forceRefresh && enumCache[cacheKey] && enumCacheTime[cacheKey]) {
            const now = Date.now();
            if (now - enumCacheTime[cacheKey] < CACHE_DURATION) {
                return enumCache[cacheKey];
            }
        }

        try {
            const response = await api.get(`/enums/${moduleName}/${category}`);
            const data = response.data || [];
            
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
     * Get all enums for a module
     */
    getEnumsByModule: async (moduleName) => {
        try {
            const response = await api.get(`/enums/module/${moduleName}`);
            return response.data || {};
        } catch (error) {
            console.error('Failed to fetch enums by module:', error);
            return {};
        }
    },

    /**
     * Get all trip-related enums
     */
    getTripEnums: async () => {
        try {
            const [statuses, types, approvalStatuses] = await Promise.all([
                enumService.getEnums('trip', 'status'),
                enumService.getEnums('trip', 'type'),
                enumService.getEnums('trip', 'approval')
            ]);
            return { statuses, types, approvalStatuses };
        } catch (error) {
            console.error('Failed to fetch trip enums:', error);
            return { statuses: [], types: [], approvalStatuses: [] };
        }
    },

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
     * Clear enum cache
     */
    clearCache: () => {
        enumCache = {};
        enumCacheTime = {};
    }
};

export default enumService;
