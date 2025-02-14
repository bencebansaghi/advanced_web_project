import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Box, List, ListItem } from '@mui/material';
import IBoard from '../interfaces/Board';
import AddBoard from './boards/AddBoard';
import DeleteBoard from './boards/DeleteBoard';
import RenameBoard from './boards/RenameBoard';

function Boards() {
  const [boards, setBoards] = useState<IBoard[]>([])
  const [showAddBoard, setShowAddBoard] = useState<boolean>(false)
  const [refresh, setRefresh] = useState<boolean>(false)
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null)

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/board', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch data: "+data.error)
      }
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    }
  }

  useEffect(() => {
    fetchBoards()
  }, [refresh])

  return (
    <Box>
      {boards.length === 0 ? (
        <Typography>No boards found</Typography>
      ) : (
        <List>
          {boards.map((board) => (
            <ListItem key={board._id}>
              {renamingBoardId === board._id ? (
                <RenameBoard
                  board_id={board._id}
                  onBoardRenamed={() => {
                    setRenamingBoardId(null);
                    setRefresh(!refresh);
                  }}
                />
              ) : (
                <>
                    <Button component={Link} to={`/board/${board._id}/${board.title}`}>
                    {board.title}
                    </Button>
                  <Button variant="outlined" onClick={() => setRenamingBoardId(board._id)}>Rename</Button>
                </>
              )}
              <DeleteBoard board_id={board._id} onBoardDeleted={() => setRefresh(!refresh)} />
            </ListItem>
          ))}
        </List>
      )}
      {showAddBoard ? (
        <AddBoard
          onBoardAdded={() => {
            setShowAddBoard(false);
            setRefresh(!refresh);
          }}
        />
      ) : (
        <Button variant="contained" onClick={() => setShowAddBoard(true)}>Add Board</Button>
      )}
    </Box>
  );
}

export default Boards;