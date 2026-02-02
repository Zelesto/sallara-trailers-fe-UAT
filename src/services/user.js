// src/services/user.js
import api from "./api"; // your axios instance

const userService = {
  getAllUsers: () => api.get("/api/users").then(res => res.data),
  createUser: (user) => api.post("/api/users", user).then(res => res.data),
  updateUser: (id, user) => api.put(`/api/users/${id}`, user).then(res => res.data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

export default userService;
