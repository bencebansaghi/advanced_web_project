import React, { useState } from "react";
import { TextField, Button, Container } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ModifyUserProps {
  userId?: string;
  onModify?: () => void;
}

const ModifyUser: React.FC<ModifyUserProps> = ({
  userId: initialUserId,
  onModify,
}) => {
  const { t } = useTranslation(["admin"]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert("No token found");
      return;
    }

    const body: { user_id?: string; username?: string; password?: string } = {};
    if (initialUserId) body.user_id = initialUserId;
    if (username) body.username = username;
    if (password) body.password = password;

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert("User updated successfully");
        if (onModify) onModify();
      } else {
        alert("Error updating user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  return (
    <Container maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <TextField
          label={t("Username")}
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label={t("Password")}
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary">
          {t("Modify Information")}
        </Button>
      </form>
    </Container>
  );
};

export default ModifyUser;
