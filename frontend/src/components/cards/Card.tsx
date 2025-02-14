import React, { useState } from 'react';
import { Card as MuiCard, CardContent, Typography, Button, Box } from '@mui/material';
import ICard from '../../interfaces/Card';
import DeleteCard from './DeleteCard';
import ModifyCard from './ModifyCard';

interface CardProps {
  card: ICard;
  onChange: () => void;
}

const Card: React.FC<CardProps> = ({ card, onChange }) => {
  const [modifying, setModifying] = useState<boolean>(false);

  return (
    <MuiCard key={card._id} id={card._id} sx={{ backgroundColor: `${card.color}80`, marginBottom: 2 }}>
      <CardContent>
      <Typography variant="h5">{card.title}</Typography>
      <Typography variant="body2">{card.description}</Typography>
      {modifying ? (
        <ModifyCard 
        card_id={card._id} 
        onChange={() => {
          onChange();
          setModifying(false);
        }} 
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => setModifying(true)}>Modify</Button>
        <DeleteCard card_id={card._id} onCardDeleted={onChange} />
        </Box>
      )}
      </CardContent>
    </MuiCard>
  );
};

export default Card;
