import React from "react";
import { Grid, Card, CardContent, Typography, Avatar, Box, Button } from "@mui/material";

const UserProfile = ({ user, isSelfView = false }) => {
  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)", p: 3 }}>
      <Grid container spacing={4}>
        {/* User Info */}
        <Grid item xs={12} md={4}>
          <Card className="card-3d">
            <CardContent sx={{ textAlign: "center" }}>
              <Avatar
                src={user.image || "/default-avatar.png"}
                alt={user.username}
                sx={{ width: 140, height: 140, mx: "auto", mb: 2, border: "3px solid #1976d2" }}
              />
              <Typography variant="h5" fontWeight="600">
                {user.username}
              </Typography>
              <Typography color="text.secondary">
                {user.roles.map(r => r.name).join(", ")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Info */}
        <Grid item xs={12} md={8}>
          <Card className="card-3d">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Info
              </Typography>
              <Typography>Email: {user.email}</Typography>
              <Typography>Status: {user.enabled ? "Enabled" : "Disabled"}</Typography>
              <Typography>Created: {new Date(user.createdAt).toLocaleString()}</Typography>
              <Typography>Updated: {new Date(user.updatedAt).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions */}
        {!isSelfView && (
          <Grid item xs={12}>
            <Card className="card-3d">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                {user.roles.flatMap(r => r.permissions).map(p => (
                  <Typography key={p.id}>
                    {p.resource} → {p.action}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            {isSelfView ? (
              <>
                <Button variant="contained">🖊️ Edit My Profile</Button>
                <Button variant="contained" color="secondary">🔒 Security</Button>
              </>
            ) : (
              <>
                <Button variant="contained">🖊️ Edit User</Button>
                <Button variant="contained" color="secondary">Assign Roles</Button>
                <Button variant="contained">📄 Docs</Button>
                <Button variant="contained" sx={{ bgcolor: "#ffa726", "&:hover": { bgcolor: "#fb8c00" } }}>
                  ⚙️ Settings
                </Button>
              </>
            )}
            <Button variant="outlined" color="error">🚪 Logout</Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile;
