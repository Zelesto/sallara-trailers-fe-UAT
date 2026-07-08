// src/services/enumService.js
import api from './api';

export const enumService = {
  // Get all enums for a type (system + custom)
  getEnums: async (enumType) => {
    const response = await api.get(`/api/enums/${enumType}`);
    return response.data;
  },

  // Add custom enum
  addCustomEnum: async (data) => {
    const response = await api.post('/api/enums/custom', data);
    return response.data;
  },

  // Update custom enum
  updateCustomEnum: async (id, data) => {
    const response = await api.put(`/api/enums/custom/${id}`, data);
    return response.data;
  },

  // Delete custom enum
  deleteCustomEnum: async (id) => {
    await api.delete(`/api/enums/custom/${id}`);
  }
};

// src/components/EnumManagement.jsx
import React, { useState, useEffect } from 'react';
import { enumService } from '../services/enumService';

const EnumManagement = ({ enumType, label }) => {
  const [enums, setEnums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newEnum, setNewEnum] = useState({ value: '', displayName: '', icon: '', color: '' });

  const loadEnums = async () => {
    setLoading(true);
    try {
      const data = await enumService.getEnums(enumType);
      setEnums(data);
    } catch (error) {
      console.error('Error loading enums:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnums();
  }, [enumType]);

  const handleAdd = async () => {
    try {
      await enumService.addCustomEnum({
        enumType,
        ...newEnum
      });
      setNewEnum({ value: '', displayName: '', icon: '', color: '' });
      await loadEnums();
    } catch (error) {
      console.error('Error adding enum:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enum?')) return;
    try {
      await enumService.deleteCustomEnum(id);
      await loadEnums();
    } catch (error) {
      console.error('Error deleting enum:', error);
      alert(error.response?.data?.message || 'Failed to delete enum');
    }
  };

  return (
    <div className="enum-management">
      <h4>{label} Enums</h4>
      
      {/* List existing enums */}
      <div className="enum-list">
        {enums.map(enumItem => (
          <div key={enumItem.id} className="enum-item">
            <span>{enumItem.icon} {enumItem.displayName}</span>
            {!enumItem.isSystem && (
              <button onClick={() => handleDelete(enumItem.id)}>Delete</button>
            )}
          </div>
        ))}
      </div>

      {/* Add new enum */}
      <div className="add-enum">
        <input 
          placeholder="Value (e.g., GROCERY)"
          value={newEnum.value}
          onChange={(e) => setNewEnum({...newEnum, value: e.target.value.toUpperCase()})}
        />
        <input 
          placeholder="Display Name"
          value={newEnum.displayName}
          onChange={(e) => setNewEnum({...newEnum, displayName: e.target.value})}
        />
        <input 
          placeholder="Icon (emoji)"
          value={newEnum.icon}
          onChange={(e) => setNewEnum({...newEnum, icon: e.target.value})}
        />
        <button onClick={handleAdd}>Add</button>
      </div>
    </div>
  );
};

export default EnumManagement;
