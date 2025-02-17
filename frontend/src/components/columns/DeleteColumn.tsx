import React from "react";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DeleteColumnProps {
  column_id: string;
  onColumnDeleted: () => void;
}

const DeleteColumn: React.FC<DeleteColumnProps> = ({
  column_id,
  onColumnDeleted,
}) => {
  const { t } = useTranslation(["button"]);
  const deleteColumn = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/column", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ column_id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to delete column: " + data.error);
      }
      onColumnDeleted();
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  return (
    <Button variant="contained" color="error" onClick={deleteColumn}>
      {t("Delete")}
    </Button>
  );
};

export default DeleteColumn;
