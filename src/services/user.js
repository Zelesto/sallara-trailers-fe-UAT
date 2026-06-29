// src/services/user.js
import api from "./api";

const userService = {
  getAllUsers: async () => {
    try {
      console.log("🔍 Fetching all users...");
      const response = await api.get("/users");
      console.log("📦 Full response:", response);
      console.log("📦 Response data:", response.data);
      console.log("📦 Is array?", Array.isArray(response.data));
      
      // The API returns the array directly in response.data
      if (Array.isArray(response.data)) {
        console.log(`✅ Found ${response.data.length} users`);
        return response.data; // Return the array directly
      }
      
      // Fallback: try to find array in response
      console.warn("⚠️ Unexpected response format, trying to extract array...");
      return [];
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
