import React from 'react';
import { Button } from '@mui/material';

interface DeleteCardProps {
  card_id: string;
  onCardDeleted: () => void;
}

const DeleteCard: React.FC<DeleteCardProps> = ({ card_id, onCardDeleted }) => {
  const deleteCard = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/card', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ card_id })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to delete card: " + data.error);
      }
      onCardDeleted();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  return (
    <Button variant="contained" color="error" onClick={deleteCard}>Delete</Button>
  );
};

export default DeleteCard;
