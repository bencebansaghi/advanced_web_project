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

const boardRouter: Router = Router();

// Route to get boards of a user
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { email (of requested user) }
boardRouter.get(
  "/by_user",
  validateUserToken,
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      const boards: IBoard[] = await Board.find({ userID: user?._id });
      if (!boards || boards.length==0) {
        res.status(404).json({error: "No boards found"})
        return
      }
      res.status(200).json(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
  
// Route to delete a board and its associated columns and cards
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { board_id }
boardRouter.delete(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body.board_id) {
      res.status(400).json({ error: "board_id is required" });
      return;
    }
    const board = await Board.findById(req.body.board_id).catch(() => null);

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
    try {
      const columns = await Column.find({ boardID: req.body.board_id });
      for (const column of columns) {
        await Card.deleteMany({ columnID: column._id });
      }
      await Column.deleteMany({ boardID: req.body.board_id });
      const deletedBoard = await Board.findByIdAndDelete(req.body.board_id);
      if (!deletedBoard) {
        res.status(404).json({ error: "Board not found" });
        return;
      }
      res.status(200).json({ message: "Board and associated columns and cards deleted successfully" });
    } catch (error) {
      console.error("Error deleting board, columns, and cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default boardRouter;
