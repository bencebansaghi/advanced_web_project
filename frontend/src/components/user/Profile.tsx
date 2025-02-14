import React, { useEffect, useState } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import ModifyUser from "./ModifyUser";
import DeleteUser from "./DeleteUser";

const Profile: React.FC = () => {
  const [user, setUser] = useState<{ _id: string; email: string; username: string; isAdmin: boolean } | null>(null);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          const data = await response.json();
          console.error(`Failed to get user: ${data.error}`);
        }
      } catch (error) {
        console.error("Failed to get user:", error);
      }
    };

    fetchUser();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh(!refresh);
  };

  if (!user) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography>Email: {user.email}</Typography>
        <Typography>Username: {user.username}</Typography>
        <Typography>Admin: {user.isAdmin ? "Yes" : "No"}</Typography>
        <ModifyUser userId={user._id} onModify={handleRefresh} />
        <DeleteUser userId={user._id} onDelete={() => window.location.href = "/"} />
      </Box>
    </Container>
  );
};

export default Profile;