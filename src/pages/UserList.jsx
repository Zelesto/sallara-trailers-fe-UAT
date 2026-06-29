import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import userService from "../services/user";

export default function UserList() {
  const navigate = useNavigate();
  
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAllUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users: {error.message}</div>;

  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "username", headerName: "Username", flex: 1 },
    { field: "email", headerName: "Email", flex: 1 },
    { 
      field: "enabled", 
      headerName: "Status", 
      width: 120,
      renderCell: (params) => (
        <span style={{ color: params.value ? 'green' : 'red' }}>
          {params.value ? '✅ Active' : '❌ Inactive'}
        </span>
      )
    },
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
      <DataGrid 
        rows={users} 
        columns={columns} 
        pageSize={10}
        rowsPerPageOptions={[5, 10, 25]}
        disableSelectionOnClick
      />
    </Box>
  );
}
