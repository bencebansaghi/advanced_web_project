import React, { useEffect, useState } from 'react'
import IBoard from '../interfaces/Board';
import AddBoard from './boards/AddBoard'
import DeleteBoard from './boards/DeleteBoard';
import RenameBoard from './boards/RenameBoard';
import { Link } from 'react-router-dom';

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
    <>
      {boards.length === 0 ? (
        <p>No boards found</p>
      ) : (
        <ul>
          {boards.map((board) => (
            <li key={board._id}>
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
                  <Link to={`/board/${board._id}/${board.title}`}>{board.title}</Link>
                  <button onClick={() => setRenamingBoardId(board._id)}>Rename</button>
                </>
              )}
              <DeleteBoard board_id={board._id} onBoardDeleted={() => setRefresh(!refresh)} />
            </li>
          ))}
        </ul>
      )}
      {showAddBoard ? (
        <AddBoard
          onBoardAdded={() => {
            setShowAddBoard(false);
            setRefresh(!refresh);
          }}
        />
      ) : (
        <button onClick={() => setShowAddBoard(true)}>Add Board</button>
      )}
    </>
  );
}

export default Boards