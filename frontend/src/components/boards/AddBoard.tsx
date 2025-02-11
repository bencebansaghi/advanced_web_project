import React, { useState } from 'react'

const AddBoard: React.FC<{ onBoardAdded: () => void }> = ({ onBoardAdded }) => {
  const [title, setTitle] = useState<string>('')

  const postBoard = async () => {
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch('/api/board', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      })
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch data: "+data.error)
      }
      onBoardAdded()
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    }
  }

  return (
    <>
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Enter board title" 
      />
      <button onClick={postBoard}>submit</button>
    </>
  )
}

export default AddBoard