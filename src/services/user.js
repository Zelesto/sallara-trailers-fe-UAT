// src/services/user.js
import api from "./api";

const userService = {
  getAllUsers: async () => {
    try {
      console.log("🔍 Fetching all users...");
      const response = await api.get("/users");
      console.log("📦 Raw API response:", response);
      
      // The response is already the data (array of users)
      if (Array.isArray(response)) {
        console.log(`✅ Found ${response.length} users`);
        return response;
      }
      
      // If response has a data property that's an array
      if (response && response.data && Array.isArray(response.data)) {
        console.log(`✅ Found ${response.data.length} users in response.data`);
        return response.data;
      }
      
      // If response has a content property (Spring Data Page)
      if (response && response.content && Array.isArray(response.content)) {
        console.log(`✅ Found ${response.content.length} users in response.content`);
        return response.content;
      }
      
      console.warn("⚠️ Unexpected response format:", response);
      return [];
    } catch (error) {
      console.error("❌ Error in getAllUsers:", error);
      throw error;
    }
  },
  createUser: (user) => api.post("/users", user).then(res => res.data),
  updateUser: (id, user) => api.put(`/users/${id}`, user).then(res => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserById: async (id) => {
    try {
      const result = await api.get(`/users/${id}`);
      console.log(`📦 User ${id}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error fetching user ${id}:`, error);
      throw error;
    }
  },
};

export default userService;
