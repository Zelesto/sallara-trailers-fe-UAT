// src/services/user.js
import api, { unwrapApiResponse } from "./api";

const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get("/users");
      const data = unwrapApiResponse(response, []);
      console.log("📦 Users response:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      console.log(`📦 User ${id}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error fetching user ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      console.log("📤 Creating user:", userData);
      const response = await api.post("/users", userData);
      console.log("✅ User created:", response);
      return response;
    } catch (error) {
      console.error("❌ Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      console.log(`📤 Updating user ${id}:`, userData);
      const response = await api.put(`/users/${id}`, userData);
      console.log("✅ User updated:", response);
      return response;
    } catch (error) {
      console.error(`❌ Error updating user ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      console.log(`🗑️ Deleting user ${id}`);
      await api.delete(`/users/${id}`);
      console.log("✅ User deleted");
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      throw error;
    }
  },
};

export default userService;
