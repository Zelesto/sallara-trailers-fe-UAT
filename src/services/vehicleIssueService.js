// src/services/vehicleIssueService.js
import api from './api';

export const vehicleIssueService = {
  /**
   * Get all vehicle issues
   */
  getVehicleIssues: async () => {
    try {
      console.log('📤 Fetching vehicle issues from API');
      const response = await api.get('/inventory/vehicle-issues');
      console.log('📥 Full response:', response);
      
      // ✅ The response from axios is wrapped in response.data
      // But the interceptor might have already unwrapped it
      let data = response.data;
      
      // If data is undefined, try response itself
      if (data === undefined) {
        data = response;
      }
      
      console.log('📥 Data after extraction:', data);
      
      // If data is null or undefined, return empty array
      if (!data) {
        console.warn('⚠️ No data received from API');
        return [];
      }
      
      // If data is an array, return it
      if (Array.isArray(data)) {
        console.log('📥 Data is an array with', data.length, 'items');
        return data;
      }
      
      // If data has a content property that's an array
      if (data.content && Array.isArray(data.content)) {
        console.log('📥 Data has content array with', data.content.length, 'items');
        return data.content;
      }
      
      // If data has a data property that's an array
      if (data.data && Array.isArray(data.data)) {
        console.log('📥 Data has data array with', data.data.length, 'items');
        return data.data;
      }
      
      // If data is an object with numeric keys (array-like)
      if (typeof data === 'object' && !Array.isArray(data)) {
        const values = Object.values(data);
        const arrayProp = values.find(v => Array.isArray(v) && v.length > 0);
        if (arrayProp) {
          console.log('📥 Found array property with', arrayProp.length, 'items');
          return arrayProp;
        }
      }
      
      console.warn('⚠️ No array found in response, returning empty array');
      console.warn('⚠️ Response structure:', JSON.stringify(data, null, 2));
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching vehicle issues:', error);
      return [];
    }
  },

  // Driver Issue Methods
getDriverIssues: async () => {
  try {
    console.log('📤 Fetching driver issues from API');
    const response = await api.get('/inventory/driver-issues');
    console.log('📥 Driver issues response:', response);
    const data = response.data || response;
    return Array.isArray(data) ? data : (data?.content || []);
  } catch (error) {
    console.error('❌ Error fetching driver issues:', error);
    return [];
  }
},

createDriverIssue: async (data) => {
  try {
    console.log('📤 Creating driver issue:', data);
    const response = await api.post('/inventory/driver-issues', data);
    console.log('📥 Create driver issue response:', response);
    return response.data || response;
  } catch (error) {
    console.error('❌ Error creating driver issue:', error);
    throw error;
  }
},

returnDriverItems: async (issueId, returnData) => {
  try {
    console.log('📤 Returning driver items:', issueId, returnData);
    const response = await api.post(`/inventory/driver-issues/${issueId}/return`, returnData);
    return response.data || response;
  } catch (error) {
    console.error('❌ Error returning driver items:', error);
    throw error;
  }
},

swapDriverItem: async (issueId, swapData) => {
  try {
    console.log('📤 Swapping driver item:', issueId, swapData);
    const response = await api.post(`/inventory/driver-issues/${issueId}/swap`, swapData);
    return response.data || response;
  } catch (error) {
    console.error('❌ Error swapping driver item:', error);
    throw error;
  }
},

  /**
   * Create a new vehicle issue
   */
  createVehicleIssue: async (data) => {
    try {
      console.log('📤 Creating vehicle issue:', data);
      const response = await api.post('/inventory/vehicle-issues', data);
      console.log('📥 Create response:', response);
      
      const result = response.data || response;
      console.log('📥 Created issue:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error creating vehicle issue:', error);
      throw error;
    }
  },

  /**
   * Return items from a vehicle issue
   */
  returnItems: async (issueId, returnData) => {
    try {
      console.log('📤 Returning items from issue:', issueId, returnData);
      const response = await api.post(`/inventory/vehicle-issues/${issueId}/return`, returnData);
      console.log('📥 Return response:', response);
      
      const result = response.data || response;
      console.log('📥 Return result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error returning items:', error);
      throw error;
    }
  },

  /**
   * Get vehicle issues by vehicle ID
   */
  getVehicleIssuesByVehicle: async (vehicleId) => {
    try {
      console.log('📤 Fetching issues for vehicle:', vehicleId);
      const response = await api.get(`/inventory/vehicle-issues/vehicle/${vehicleId}`);
      const data = response.data || response;
      return Array.isArray(data) ? data : (data?.content || []);
    } catch (error) {
      console.error('❌ Error fetching vehicle issues by vehicle:', error);
      return [];
    }
  },

  /**
   * Get vehicle issue by ID
   */
  getVehicleIssueById: async (issueId) => {
    try {
      console.log('📤 Fetching issue:', issueId);
      const response = await api.get(`/inventory/vehicle-issues/${issueId}`);
      return response.data || response;
    } catch (error) {
      console.error('❌ Error fetching vehicle issue:', error);
      throw error;
    }
  }
};

export default vehicleIssueService;
