import React, { useState, useEffect } from "react";
import { TextField, Button, Box } from "@mui/material";
import { SketchPicker } from "react-color";
import { useTranslation } from "react-i18next";

interface ModifyCardProps {
  card_id: string;
  onChange: () => void;
}

const ModifyCard: React.FC<ModifyCardProps> = ({ card_id, onChange }) => {
  const { t } = useTranslation(["button"]);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("");

  useEffect(() => {
    // Fetch card data if needed and set title, description, and color
  }, [card_id]);

  const modifyCard = async () => {
    try {
      const token = localStorage.getItem("jwt");
      const body: {
        card_id: string;
        title?: string;
        description?: string;
        color?: string;
      } = { card_id };
      if (title) body.title = title;
      if (description) body.description = description;
      if (color) body.color = color;

      const response = await fetch("/api/card/modify", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to modify card: " + data.error);
      }
      onChange();
    } catch (error) {
      console.error("Failed to modify card:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField
        label={t("Card Title")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("Enter card title")}
      />
      <TextField
        label={t("Card Description")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("Enter card description")}
      />
      <SketchPicker
        color={color}
        onChangeComplete={(color) => setColor(color.hex)}
      />
      <Button variant="contained" onClick={modifyCard}>
        {t("Submit")}
      </Button>
      <Button variant="contained" onClick={onChange}>
        {t("Cancel")}
      </Button>
    </Box>
  );
};

export default ModifyCard;
