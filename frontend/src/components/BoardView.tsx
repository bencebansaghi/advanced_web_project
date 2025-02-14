import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import { getColumns } from './columns/getColumns';
import IColumn from '../interfaces/Column';
import AddColumn from './columns/AddColumn';
import DeleteColumn from './columns/DeleteColumn';
import RenameColumn from './columns/RenameColumn';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ICard from '../interfaces/Card';
import Card from './cards/Card';
import AddCard from './cards/AddCard';

const Board = () => {
  const { board_id, board_title } = useParams();
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState<boolean>(false);
  const [cards, setCards] = useState<Record<string, ICard[]>>({});
  const [addingCardColumnId, setAddingCardColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (board_id) {
      const fetchColumns = async () => {
        const columnsData = await getColumns(board_id);
        const sortedColumns = columnsData.sort((a, b) => a.order - b.order);
        setColumns(sortedColumns);
        setLoading(false);
      };
      fetchColumns();
    }
  }, [board_id, refresh]);

  useEffect(() => {
    const fetchAllCards = async () => {
      if (!board_id || columns.length === 0) return;
      const allCards = {};
      for (const column of columns) {
        try {
          const token = localStorage.getItem('jwt');
          const response = await fetch(`/api/card?column_id=${column._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          });
          const data = await response.json();
          if (response.ok) {
            allCards[column._id] = data;
          } else {
            console.error(`Failed to get cards for column ${column.title}: ${data.error}`);
            allCards[column._id] = [];
          }
        } catch (error) {
          console.error('Failed to get cards:', error);
          allCards[column._id] = [];
        }
      }
      setCards(allCards);
    };
    fetchAllCards();
  }, [board_id, refresh, columns]);

  const onDragEnd = async (result: any) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
      if (source.index === destination.index) return;

      const reorderedColumns = Array.from(columns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);

      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      }));

      setColumns(updatedColumns);

      try {
        const token = localStorage.getItem('jwt');
        await Promise.all(
          updatedColumns.map(async (column) => {
            await fetch('/api/column/modify', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                column_id: column._id,
                order: column.order,
              }),
            });
          })
        );
      } catch (error) {
        console.error('Failed to reorder columns:', error);
        setRefresh(!refresh); // Revert changes on error
      }
      setRefresh(!refresh);
      return;
    }

    if (type === 'CARD') {
      const sourceColumnId = source.droppableId;
      const destinationColumnId = destination.droppableId;

      const sourceColumn = columns.find(column => column._id === sourceColumnId);
      const destinationColumn = columns.find(column => column._id === destinationColumnId);

      if (!sourceColumn || !destinationColumn) return;

      const sourceCards = cards[sourceColumnId] ? Array.from(cards[sourceColumnId]) : [];
      const destinationCards = cards[destinationColumnId] ? Array.from(cards[destinationColumnId]) : [];

      const [movedCard] = sourceCards.splice(source.index, 1);

      if (sourceColumnId === destinationColumnId) {
        destinationCards.splice(destination.index, 0, movedCard);

        const updatedCards = {
          ...cards,
          [destinationColumnId]: destinationCards
        };
        setCards(updatedCards);

        try {
          const token = localStorage.getItem('jwt');
          await fetch('/api/card/modify', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ card_id: movedCard._id, order: destination.index })
          });
        } catch (error) {
          console.error('Failed to reorder cards within column:', error);
          setRefresh(!refresh);
        }
        const updatedCardsInColumn = Array.from(cards[sourceColumnId]);
                updatedCardsInColumn.forEach((card, index) => {
                  card.order = index;
                });
                setCards({ ...cards, [sourceColumnId]: updatedCardsInColumn });
      } else {
        movedCard.columnID = destinationColumnId;
        destinationCards.splice(destination.index, 0, movedCard);

        const updatedCards = {
          ...cards,
          [sourceColumnId]: sourceCards,
          [destinationColumnId]: destinationCards
        };
        setCards(updatedCards);

        try {
          const token = localStorage.getItem('jwt');
          await fetch('/api/card/move', {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ card_id: movedCard._id, column_id: destinationColumnId })
          });
        } catch (error) {
          console.error('Failed to move card between columns:', error);
          setRefresh(!refresh);
        }
      }
      setRefresh(!refresh);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!board_id) {
    return <div>Board not found.</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h1" gutterBottom>{board_title}</Typography>
          <Button variant="outlined" component={Link} to="/boards">
            Back
          </Button>
        </Box>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided) => (
            <Box display="flex" flexWrap="nowrap" overflow="auto" {...provided.droppableProps} ref={provided.innerRef}>
              {columns.map((column, index) => (
                <Draggable key={column._id} draggableId={column._id} index={index}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{
                        width: 300,
                        marginRight: 2,
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '16px',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
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
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>{column.title}</Typography>
                            <Box>
                              <Button variant="outlined" size="small" onClick={() => setRenamingColumnId(column._id)}>Rename</Button>
                              <DeleteColumn column_id={column._id} onColumnDeleted={() => setRefresh(!refresh)} />
                            </Box>
                          </Box>
                          <Droppable droppableId={column._id} type="CARD">
                            {(provided) => (
                                <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ padding: 1, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                                {cards[column._id]?.sort((a, b) => a.order - b.order).map((card, index) => (
                                  <Draggable key={`${card._id}-${index}`} draggableId={card._id} index={index}>
                                  {(provided) => (
                                    <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} sx={{ marginBottom: 1 }}>
                                    <Card 
                                      key={`${card._id}-${index}`} 
                                      card={card} 
                                      onChange={() => setRefresh(!refresh)} 
                                    />
                                    </Box>
                                  )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                </Box>
                            )}
                          </Droppable>
                          {addingCardColumnId === column._id ? (
                            <AddCard 
                              column_id={column._id} 
                              onCardAdded={() => {
                                setAddingCardColumnId(null);
                                setRefresh(!refresh);
                              }} 
                            />
                          ) : (
                            <Button variant="contained" onClick={() => setAddingCardColumnId(column._id)}>Add Card</Button>
                          )}
                        </>
                      )}
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
        {showAddColumn ? (
          <AddColumn
            board_id={board_id}
            onColumnAdded={() => {
              setShowAddColumn(false);
              setRefresh(!refresh);
            }}
          />
        ) : (
          <Button variant="contained" onClick={() => setShowAddColumn(true)}>Add Column</Button>
        )}
      </Box>
    </DragDropContext>
  );
};

export default Board;