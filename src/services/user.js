// src/services/user.js
import api from "./api"; // your axios instance

const userService = {
  getAllUsers: () => api.get("/users").then(res => res.data),
  createUser: (user) => api.post("/users", user).then(res => res.data),
  updateUser: (id, user) => api.put(`/users/${id}`, user).then(res => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default userService;
