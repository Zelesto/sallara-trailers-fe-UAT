// src/services/user.js
import api from "./api";

const userService = {
  getAllUsers: async () => {
    try {
      console.log("🔍 Fetching all users...");
      const response = await api.get("/users");
      console.log("📦 Raw API response:", response);
      console.log("📦 Response data:", response.data);
      console.log("📦 Is array?", Array.isArray(response.data));
      
      // The response.data should already be the array of users
      // But let's handle different response formats
      if (Array.isArray(response.data)) {
        console.log(`✅ Found ${response.data.length} users`);
        return response.data;
      } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
        console.log(`✅ Found ${response.data.content.length} users in content`);
        return response.data.content;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`✅ Found ${response.data.data.length} users in data`);
        return response.data.data;
      } else {
        console.warn("⚠️ Unexpected response format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("❌ Error in getAllUsers:", error);
      throw error;
    }
  },
  createUser: (user) => api.post("/users", user).then(res => res.data),
  updateUser: (id, user) => api.put(`/users/${id}`, user).then(res => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`).then(res => res.data),
};

export default userService;
