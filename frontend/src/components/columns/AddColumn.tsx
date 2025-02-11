import React, { useState } from 'react';

interface AddColumnProps {
  board_id: string;
  onColumnAdded: () => void;
}

const AddColumn: React.FC<AddColumnProps> = ({ board_id, onColumnAdded }) => {
  const [title, setTitle] = useState<string>('');

  const postColumn = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/column', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ board_id, title })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to add column: " + data.error);
      }
      onColumnAdded();
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  return (
    <>
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Enter column title" 
      />
      <button onClick={postColumn}>Submit</button>
    </>
  );
};

export default AddColumn;
