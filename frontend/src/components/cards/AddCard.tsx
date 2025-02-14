import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { SketchPicker } from 'react-color';

interface AddCardProps {
  column_id: string;
  onCardAdded: () => void;
}

const AddCard: React.FC<AddCardProps> = ({ column_id, onCardAdded }) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>('#fff');

  const postCard = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/card', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ column_id, title, description, color })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to add card: " + data.error);
      }
      onCardAdded();
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Card Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter card title"
      />
      <TextField
        label="Card Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter card description"
      />
      <SketchPicker
        color={color}
        onChangeComplete={(color) => setColor(color.hex)}
      />
      <Button variant="contained" onClick={postCard}>Submit</Button>
      <Button variant="contained" onClick={onCardAdded}>Cancel</Button>
    </Box>
  );
};

export default AddCard;
