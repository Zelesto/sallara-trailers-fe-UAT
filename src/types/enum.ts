// src/types/enum.ts

export interface EnumMaster {
    id: number;
    moduleName: string;
    category: string;
    code: string;
    displayName: string;
    description: string;
    sortOrder: number;
    isDefault: boolean;
    isActive: boolean;
    isSystem: boolean;     
    isEditable: boolean;   
    isDeletable: boolean;  
    colorCode: string;
    iconName: string;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

export interface EnumGroup {
    [category: string]: EnumMaster[];
}

// ⭐ NEW: Admin UI Helper
export interface EnumPermission {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDeactivate: boolean;
}
