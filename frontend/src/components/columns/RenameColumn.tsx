import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

interface RenameColumnProps {
  column_id: string;
  onColumnRenamed: () => void;
}

const RenameColumn: React.FC<RenameColumnProps> = ({ column_id, onColumnRenamed }) => {
  const [title, setTitle] = useState<string>('');

  const renameColumn = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/column/modify', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ column_id, title })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to rename column: " + data.error);
      }
      onColumnRenamed();
    } catch (error) {
      console.error('Failed to rename column:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <TextField
        label="Column Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter column title"
      />
      <Button variant="contained" onClick={renameColumn}>Submit</Button>
    </Box>
  );
};

export default RenameColumn;
