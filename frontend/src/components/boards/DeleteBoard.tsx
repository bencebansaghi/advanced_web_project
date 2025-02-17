import React from "react";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DeleteBoardProps {
  board_id: string;
  onBoardDeleted: () => void;
}

const DeleteBoard: React.FC<DeleteBoardProps> = ({
  board_id,
  onBoardDeleted,
}) => {
  const { t } = useTranslation(["button"]);
  const deleteBoard = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/board", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board_id: board_id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to delete board: " + data.error);
      }
      onBoardDeleted();
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  };

  return (
    <Button variant="contained" color="error" onClick={deleteBoard}>
      {t("Delete")}
    </Button>
  );
};

export default DeleteBoard;
