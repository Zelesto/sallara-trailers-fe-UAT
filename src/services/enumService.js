// src/services/enumService.ts
import api from './api';
import { EnumMaster, EnumPermission } from '../types/enum';

export const enumService = {
    // ============================================================
    // READ OPERATIONS
    // ============================================================

    getEnums: async (moduleName: string, category: string): Promise<EnumMaster[]> => {
        const response = await api.get(`/enums/${moduleName}/${category}`);
        return response.data;
    },

    getSystemEnums: async (moduleName: string, category: string): Promise<EnumMaster[]> => {
        const response = await api.get(`/enums/${moduleName}/${category}/system`);
        return response.data;
    },

    getCustomEnums: async (moduleName: string, category: string): Promise<EnumMaster[]> => {
        const response = await api.get(`/enums/${moduleName}/${category}/custom`);
        return response.data;
    },

    getEnumsByModule: async (moduleName: string): Promise<Record<string, EnumMaster[]>> => {
        const response = await api.get(`/enums/module/${moduleName}`);
        return response.data;
    },

    getDefaultEnum: async (moduleName: string, category: string): Promise<EnumMaster> => {
        const response = await api.get(`/enums/${moduleName}/${category}/default`);
        return response.data;
    },

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    createEnum: async (data: Partial<EnumMaster>): Promise<EnumMaster> => {
        const response = await api.post('/enums', data);
        return response.data;
    },

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    updateEnum: async (id: number, data: Partial<EnumMaster>): Promise<EnumMaster> => {
        const response = await api.put(`/enums/${id}`, data);
        return response.data;
    },

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    deleteEnum: async (id: number): Promise<void> => {
        await api.delete(`/enums/${id}`);
    },

    // ============================================================
    // PERMISSION HELPERS
    // ============================================================

    getPermissions: (enumItem: EnumMaster): EnumPermission => {
        return {
            canCreate: !enumItem.isSystem,  // Can't create system enums
            canEdit: enumItem.isEditable,
            canDelete: enumItem.isDeletable && !enumItem.isSystem,
            canDeactivate: enumItem.isEditable
        };
    }
};
