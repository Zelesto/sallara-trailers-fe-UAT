// src/services/user.js
import api from "./api";

const userService = {
  getAllUsers: async () => {
    try {
      const response = await api.get("/users");
      console.log("User service response:", response);
      return response.data;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      throw error;
    }
  },
  createUser: (user) => api.post("/users", user).then(res => res.data),
  updateUser: (id, user) => api.put(`/users/${id}`, user).then(res => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`).then(res => res.data),
};

export default userService;
