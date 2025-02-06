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
    "/modify",
    validateUserToken,
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      const { card_id, title, color, description, order } = req.body;
        if (!title && !color && !description && !order) {
            res.status(400).json({ error: "Nothing to modify" });
            return;
        }
        if (!card_id) {
            res.status(400).json({ error: "card_id is required" });
            return;
        }
        const card = await Card.findById(card_id).catch(() => null);

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
        const { card_id, title, color, description, order } = req.body;
        try {
            const card = await Card.findById(card_id);
            if (!card) {
                res.status(404).json({ error: "Card not found" });
                return;
            }
            if (order !== undefined && order !== card.order) {
                const cards = await Card.find({ columnID: card.columnID });
                for (const otherCard of cards) {
                    if (otherCard._id?.toString() !== card_id) {
                      if (card.order < order){
                        if (otherCard.order >= card.order && otherCard.order <= order){
                          otherCard.order-=1
                        }
                      }
                      if (card.order > order){
                        if (otherCard.order <= card.order && otherCard.order >= order){
                          otherCard.order+=1
                        }
                      }
                        await otherCard.save();
                    }
                }
            }
            const updatedCard = await Card.findByIdAndUpdate(
                card_id,
                { title, description, color, order },
                { new: true, runValidators: true }
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

// Route to move a card to a different column
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { card_id, column_id }
cardRouter.put(
  "/move",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { card_id, column_id } = req.body;
    if (!card_id || !column_id) {
      res.status(400).json({ error: "card_id and column_id are required" });
      return;
    }

    const card = await Card.findById(card_id).catch(() => null);
    if (!card) {
      res.status(404).json({ error: "Card not found" });
      return;
    }
    const oldColumn = await Column.findById(card.columnID).catch(() => null);
    if (!oldColumn) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    const newColumn = await Column.findById(column_id).catch(() => null);
    if (!newColumn) {
      res.status(404).json({ error: "New column not found" });
      return;
    }

    if (!oldColumn.boardID.equals(newColumn.boardID)) {
      res.status(404).json({ error: "You can only move cards within the same board"})
      return
    }

    const board = await Board.findById(newColumn.boardID);
    const user = await User.findById(board?.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    const { card_id, column_id } = req.body;
    try {
      const updatedCard = await Card.findByIdAndUpdate(
        card_id,
        { columnID: column_id },
        { new: true, runValidators: true }
      );
      if (!updatedCard) {
        res.status(404).json({ error: "Card not found" });
        return;
      }
      res.status(200).json(updatedCard);
    } catch (error) {
      console.error("Error moving card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


export default cardRouter;
