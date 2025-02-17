import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

interface AddColumnProps {
  board_id: string;
  onColumnAdded: () => void;
}

const AddColumn: React.FC<AddColumnProps> = ({ board_id, onColumnAdded }) => {
  const { t } = useTranslation(["button"]);
  const [title, setTitle] = useState<string>("");

  const postColumn = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/column", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board_id, title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to add column: " + data.error);
      }
      onColumnAdded();
    } catch (error) {
      console.error("Failed to add column:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        label="Column Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("Enter column title")}
      />
      <Button variant="contained" onClick={postColumn}>
        {t("Submit")}
      </Button>
    </Box>
  );
};

export default AddColumn;
