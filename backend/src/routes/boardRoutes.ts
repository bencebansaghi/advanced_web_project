import dotenv from "dotenv";
import { Response, Router, NextFunction } from "express";

dotenv.config();

import { User } from "../models/User";
import { Column } from "../models/Column";
import { Card } from "../models/Card";
import { IBoard, Board } from "../models/Board";
import {
  validateUserToken,
  CustomRequest,
  checkAccess,
} from "../middlewares/validateToken";

const boardRouter: Router = Router();

// Route to get boards of a user
// Required in request headers: { Authorization: Bearer <token> }
// Required in request query: { email (of requested user, if not given, gets own) }
boardRouter.get(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.query.email) {
      req.body.email=req.user?.email
    } else req.body.email = req.query.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      const boards: IBoard[] = await Board.find({ userID: user?._id });
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
      res
        .status(200)
        .json({
          message:
            "Board and associated columns and cards deleted successfully",
        });
    } catch (error) {
      console.error("Error deleting board, columns, and cards:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to create a new board
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { title }
boardRouter.post(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      req.body.email = user.email;
    } catch {
      res.status(404).json({ error: "User not found" });
      return;
    }

    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    try {
      const { title } = req.body;
      const board = new Board({
        userID: req.user?.id,
        title,
      });

      await board.save();
      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating board:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to update a board's title
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { board_id, title }
boardRouter.put(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { board_id, title } = req.body;
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
    try {
      const { board_id, title } = req.body;
      const updatedBoard = await Board.findByIdAndUpdate(
        board_id,
        { title },
        { new: true }
      );
      if (!updatedBoard) {
        res.status(404).json({ error: "Board not found" });
        return;
      }
      res.status(200).json(updatedBoard);
    } catch (error) {
      console.error("Error updating board:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default boardRouter;
