import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Request, Response, Router, NextFunction } from "express";

dotenv.config()

import { IUser, User } from "../models/User";
import { IColumn, Column } from "../models/Column";
import { ICard, Card } from "../models/Card";
import { IBoard, Board } from "../models/Board";
import validateUserLogin from "../middlewares/validateLogin";
import validateUserRegister from "../middlewares/validateRegister";
import { validateUserToken, validateAdmin, CustomRequest, checkAccess } from "../middlewares/validateToken";
import { errorHandler } from "../middlewares/errorHandler";
import mongoose from "mongoose";

const columnRouter: Router = Router();

// Route to get columns of a board
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { board_id }
columnRouter.get(
    "/by_board",
    validateUserToken,
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      if (!req.query.board_id) {
        res.status(400).json({ error: "board_id is required" });
        return;
      }
      const board = await Board.findById(req.query.board_id).catch(() => null);
  
      if (!board) {
        res.status(404).json({ error: "Board not found" });
        return
      }
  
      const user = await User.findById(board.userID)
  
      req.body.email = user?.email;
      next();
    },
    checkAccess,
    async (req: CustomRequest, res: Response) => {
      const columns = await Column.find({ boardID: req.query.board_id });
      if (!columns || columns.length==0) {
        res.status(404).json({ error: "No columns found" });
        return;
      }
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
      res.status(200).json({ message: "Column and associated cards deleted successfully" });
    } catch (error) {
      console.error("Error deleting column and cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default columnRouter;
