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

const cardRouter: Router = Router();

// Route to get columns of a board
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { board_id }
cardRouter.get(
    "/by_column",
    validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.query.column_id) {
      res.status(400).json({ error: "column_id is required" });
      return;
    }
    const column = await Column.findById(req.query.column_id).catch(() => null);

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
    const cards = await Card.find({ columnID: req.query.column_id });
    if (!cards || cards.length == 0) {
      res.status(404).json({ error: "No cards found" });
      return;
    }
    res.status(200).json(cards);
  }
);
  

// Route to delete a column and its associated cards
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { column_id }
cardRouter.delete(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.body.card_id) {
      res.status(400).json({ error: "card_id is required" });
      return;
    }
    const card = await Card.findById(req.body.card_id).catch(() => null);

    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }

    const column = await Column.findById(card.columnID);
    const board = await Board.findById(column?.boardID);
    const user = await User.findById(board?.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    try {
      const deletedCard = await Card.findByIdAndDelete(req.body.card_id);
      if (!deletedCard) {
        res.status(404).json({ error: "Card not found" });
        return;
      }
      res.status(200).json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to update a card
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { card_id, title (optional), color (optional), description (optional), order (optional) }
cardRouter.put(
    "/",
    validateUserToken,
    async (req: CustomRequest, res: Response, next: NextFunction) => {
        if (!req.body.card_id) {
            res.status(400).json({ error: "card_id is required" });
            return;
        }
        const card = await Card.findById(req.body.card_id).catch(() => null);

        if (!card) {
            res.status(404).json({ error: "Card not found" });
            return;
        }

        const column = await Column.findById(card.columnID);
        const board = await Board.findById(column?.boardID);
        const user = await User.findById(board?.userID);
        req.body.email = user?.email;
        next();
    },
    checkAccess,
    async (req: CustomRequest, res: Response) => {
        try {
            const updatedCard = await Card.findByIdAndUpdate(
                req.body.card_id,
                { title: req.body.title, description: req.body.description },
                { new: true }
            );
            if (!updatedCard) {
                res.status(404).json({ error: "Card not found" });
                return;
            }
            res.status(200).json(updatedCard);
        } catch (error) {
            console.error("Error updating card:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);


export default cardRouter;
