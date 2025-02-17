import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

interface RenameBoardProps {
  board_id: string;
  onBoardRenamed: () => void;
}

const RenameBoard: React.FC<RenameBoardProps> = ({
  board_id,
  onBoardRenamed,
}) => {
  const [title, setTitle] = useState<string>("");
  const renameBoard = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/board", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board_id: board_id, title: title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to rename board: " + data.error);
      }
      onBoardRenamed();
    } catch (error) {
      console.error("Failed to rename board:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <TextField
        label="Board Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter board title"
      />
      <Button variant="contained" onClick={renameBoard}>
        Submit
      </Button>
    </Box>
  );
};

export default RenameBoard;
