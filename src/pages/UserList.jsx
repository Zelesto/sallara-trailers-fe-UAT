import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const fetchUsers = async () => {
  const res = await axios.get("/api/users");
  return res.data;
};

export default function UserList() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, error } = useQuery(["users"], fetchUsers);

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users</div>;

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "enabled", headerName: "Enabled", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/users/${params.row.id}/details`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ height: 500, width: "100%" }}>
      <DataGrid rows={users} columns={columns} pageSize={10} />
    </Box>
  );
}
