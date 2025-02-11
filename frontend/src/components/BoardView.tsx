import React, { useEffect, useState } from 'react';
import { getColumns } from './columns/getColumns';
import IColumn from '../interfaces/Column';
import { useParams } from 'react-router-dom';
import AddColumn from './columns/AddColumn';
import DeleteColumn from './columns/DeleteColumn';
import RenameColumn from './columns/RenameColumn';

const Board = () => {
  const { board_id, board_title } = useParams();
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState<boolean>(false);

  useEffect(() => {
    if (board_id) {
      const fetchColumns = async () => {
        const columnsData = await getColumns(board_id);
        setColumns(columnsData);
        setLoading(false);
      };
      fetchColumns();
    }
  }, [board_id, refresh]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!board_id) {
    return <div>Board not found.</div>;
  }

  return (
    <div>
      <h1>{board_title}</h1>
      {columns
        .sort((a, b) => a.order - b.order)
        .map((column) => (
          <div key={column._id}>
            {renamingColumnId === column._id ? (
              <RenameColumn
                column_id={column._id}
                onColumnRenamed={() => {
                  setRenamingColumnId(null);
                  setRefresh(!refresh);
                }}
              />
            ) : (
              <>
                <h2>{column.title}</h2>
                <button onClick={() => setRenamingColumnId(column._id)}>Rename</button>
              </>
            )}
            <DeleteColumn column_id={column._id} onColumnDeleted={() => setRefresh(!refresh)} />
          </div>
        ))}
      {showAddColumn ? (
        <AddColumn
          board_id={board_id}
          onColumnAdded={() => {
            setShowAddColumn(false);
            setRefresh(!refresh);
          }}
        />
      ) : (
        <button onClick={() => setShowAddColumn(true)}>Add Column</button>
      )}
    </div>
  );
};

export default Board;