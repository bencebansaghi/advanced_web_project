import React from "react";
import { Button, Container } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DeleteUserProps {
  userId?: string;
  onDelete?: () => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({
  userId: initialUserId,
  onDelete,
}) => {
  const { t } = useTranslation(["admin"]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt");
    if (!token) {
      alert("No token found");
      return;
    }

    const body: { user_id?: string } = {};
    if (initialUserId) body.user_id = initialUserId;

    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert("User deleted successfully");
        if (onDelete) onDelete();
      } else {
        alert("Error deleting user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
  };

  return (
    <Container maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <Button type="submit" variant="contained" color="error">
          {t("Delete Profile")}
        </Button>
      </form>
    </Container>
  );
};

export default DeleteUser;
