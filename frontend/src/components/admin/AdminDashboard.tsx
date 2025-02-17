import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
} from "@mui/material";
import DeleteUser from "../user/DeleteUser";
import ModifyUser from "../user/ModifyUser";

function AdminDashboard() {
  const [users, setUsers] = useState<
    {
      _id: string;
      email: string;
      username: string;
      isAdmin: boolean;
      createdAt: Date;
    }[]
  >([]);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await fetch("/api/user/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          const data = await response.json();
          console.error(`Failed to get users: ${data.error}`);
        }
      } catch (error) {
        console.error("Failed to get users:", error);
      }
    };

    fetchUsers();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh(!refresh);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h4">Admin Dashboard</Typography>
      {Array.isArray(users) &&
        users.map((user) => (
          <Box
            key={user._id}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Typography>Username: {user.username}</Typography>
                <Typography>Email: {user.email}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControlLabel
                  control={<Checkbox checked={user.isAdmin} />}
                  label="Admin"
                  disabled
                />
                <Typography>
                  {new Date(user.createdAt).toLocaleDateString()}{" "}
                  {new Date(user.createdAt).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                localStorage.setItem("email", user.email);
                window.location.href = "/boards";
              }}
            >
              View Boards
            </Button>
            <ModifyUser userId={user._id} onModify={handleRefresh} />
            <DeleteUser userId={user._id} onDelete={handleRefresh} />
          </Box>
        ))}
    </Box>
  );
}

export default AdminDashboard;
