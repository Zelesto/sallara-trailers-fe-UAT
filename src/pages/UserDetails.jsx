import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, Typography, CircularProgress } from "@mui/material";

const fetchUserById = async (id) => {
  const res = await axios.get(`/api/users/${id}`);
  return res.data;
};

export default function UserDetails() {
  const { id } = useParams();
  const { data: user, isLoading, error } = useQuery(["user", id], () => fetchUserById(id));

  if (isLoading) return <CircularProgress />;
  if (error) return <div>Error loading user</div>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{user.username}</Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography>Enabled: {user.enabled ? "Yes" : "No"}</Typography>
        <Typography>Roles:</Typography>
        <ul>
          {user.roles?.map((role) => (
            <li key={role.id}>{role.name}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

