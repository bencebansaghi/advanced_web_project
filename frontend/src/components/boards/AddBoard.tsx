import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

const AddBoard: React.FC<{ onBoardAdded: () => void }> = ({ onBoardAdded }) => {
  const [title, setTitle] = useState<string>("");

  const postBoard = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const response = await fetch("/api/board", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch data: " + data.error);
      }
      onBoardAdded();
    } catch (error) {
      console.error("Failed to fetch boards:", error);
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
      <Button variant="contained" onClick={postBoard}>
        Submit
      </Button>
    </Box>
  );
};

export default AddBoard;
