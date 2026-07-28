// src/services/enumService.js
import api from './api';

export const enumService = {
    // ============================================================
    // READ OPERATIONS
    // ============================================================

    getEnums: async (moduleName, category) => {
        const response = await api.get(`/enums/${moduleName}/${category}`);
        return response.data;
    },

    getSystemEnums: async (moduleName, category) => {
        const response = await api.get(`/enums/${moduleName}/${category}/system`);
        return response.data;
    },

    getCustomEnums: async (moduleName, category) => {
        const response = await api.get(`/enums/${moduleName}/${category}/custom`);
        return response.data;
    },

    getEnumsByModule: async (moduleName) => {
        const response = await api.get(`/enums/module/${moduleName}`);
        return response.data;
    },

    getDefaultEnum: async (moduleName, category) => {
        const response = await api.get(`/enums/${moduleName}/${category}/default`);
        return response.data;
    },

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    createEnum: async (data) => {
        const response = await api.post('/enums', data);
        return response.data;
    },

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    updateEnum: async (id, data) => {
        const response = await api.put(`/enums/${id}`, data);
        return response.data;
    },

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    deleteEnum: async (id) => {
        await api.delete(`/enums/${id}`);
    },

    // ============================================================
    // PERMISSION HELPERS
    // ============================================================

    getPermissions: (enumItem) => {
        return {
            canCreate: !enumItem.isSystem,
            canEdit: enumItem.isEditable,
            canDelete: enumItem.isDeletable && !enumItem.isSystem,
            canDeactivate: enumItem.isEditable
        };
    }
};
