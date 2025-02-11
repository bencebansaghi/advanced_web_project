import dotenv from "dotenv";
import { Response, Router, NextFunction } from "express";

dotenv.config();

import { User } from "../models/User";
import { Column } from "../models/Column";
import { Card } from "../models/Card";
import { Board } from "../models/Board";
import {
  validateUserToken,
  CustomRequest,
  checkAccess,
} from "../middlewares/validateToken";

const columnRouter: Router = Router();

// Route to get columns of a board
// Required in request headers: { Authorization: Bearer <token> }
// Required in query: { board_id }
columnRouter.get(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.query.board_id) {
      res.status(400).json({ error: "board_id is required" });
      return;
    }
    const board = await Board.findById(req.query.board_id).catch(() => null);

    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }

    const user = await User.findById(board.userID);

    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    const columns = await Column.find({ boardID: req.query.board_id });
    res.status(200).json(columns);
  }
);

// Route to delete a column and its associated cards
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { column_id }
columnRouter.delete(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body.column_id) {
      res.status(400).json({ error: "column_id is required" });
      return;
    }
    const column = await Column.findById(req.body.column_id).catch(() => null);

    if (!column) {
      res.status(404).json({ error: "Column not found" });
      return;
    }

    const board = await Board.findById(column.boardID);
    const user = await User.findById(board?.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    try {
      await Card.deleteMany({ columnID: req.body.column_id });

      const deletedColumn = await Column.findByIdAndDelete(req.body.column_id);
      if (!deletedColumn) {
        res.status(404).json({ error: "Column not found" });
        return;
      }
      const columns= await Column.find()
      columns.forEach((column) => {
        if (column.order>deletedColumn.order){
          column.order-=1
        }
      })
      res
        .status(200)
        .json({ message: "Column and associated cards deleted successfully" });
    } catch (error) {
      console.error("Error deleting column and cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to update a column
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { column_id, title (optional), order (optional) }
columnRouter.put(
  "/modify",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { column_id, title, order } = req.body;
    if (!title && order === undefined) {
      res.status(400).json({ error: "Nothing to modify" });
      return;
    }
    if (!column_id) {
      res.status(400).json({ error: "column_id is required" });
      return;
    }
    const column = await Column.findById(column_id).catch(() => null);

    if (!column) {
      res.status(404).json({ error: "Column not found" });
      return;
    }

    const board = await Board.findById(column.boardID);
    const user = await User.findById(board?.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    const { column_id, title, order } = req.body;
    try {
      const column = await Column.findById(column_id);
      if (!column) {
        res.status(404).json({ error: "Column not found" });
        return;
      }
      if (order !== undefined && order !== column.order) {
        const columns = await Column.find({ boardID: column.boardID });
        for (const otherColumn of columns) {
          if (otherColumn._id?.toString() !== column_id) {
            if (column.order < order) {
              if (
                otherColumn.order >= column.order &&
                otherColumn.order <= order
              ) {
                otherColumn.order -= 1;
              }
            }
            if (column.order > order) {
              if (
                otherColumn.order <= column.order &&
                otherColumn.order >= order
              ) {
                otherColumn.order += 1;
              }
            }
            await otherColumn.save();
          }
        }
      }
      const updatedColumn = await Column.findByIdAndUpdate(
        column_id,
        { title, order },
        { new: true, runValidators: true }
      );
      if (!updatedColumn) {
        res.status(404).json({ error: "Column not found" });
        return;
      }
      res.status(200).json(updatedColumn);
    } catch (error) {
      console.error("Error updating column:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to create a new column
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { board_id, title, order (optional) }
columnRouter.post(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { board_id, title, order } = req.body;
    if (!board_id || !title) {
      res.status(400).json({ error: "board_id and title are required" });
      return;
    }
    const board = await Board.findById(board_id).catch(() => null);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    const user = await User.findById(board.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    const { board_id, title, order } = req.body;
    let actualOrder=0
    if (order===undefined) {
      const columns = await Column.find({boardID:board_id})
      columns?actualOrder=columns.length:actualOrder=0
    } else {
      actualOrder=order
    }
    try {
      const newColumn = new Column({
        boardID: board_id,
        title,
        order: actualOrder
      });
      await newColumn.save();
      res.status(201).json(newColumn);
    } catch (error) {
      console.error("Error creating column:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default columnRouter;
