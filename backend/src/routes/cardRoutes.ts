import dotenv from "dotenv";
import { Response, Router, NextFunction } from "express";

dotenv.config();

import { User } from "../models/User";
import { Column } from "../models/Column";
import { ICard, Card } from "../models/Card";
import { Board } from "../models/Board";
import {
  validateUserToken,
  CustomRequest,
  checkAccess,
} from "../middlewares/validateToken";

const cardRouter: Router = Router();

function isHexColor(hex: string) {
  return (
    typeof hex === "string" &&
    hex.length === 7 &&
    hex[0] === "#" &&
    !isNaN(Number("0x" + hex.slice(1)))
  );
}

// Route to get a cards by column
// Required in request headers: { Authorization: Bearer <token> }
// Required in request query: { column_id }
cardRouter.get(
  "/",
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

// Route to delete a card
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { card_id }
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
      const cards = await Card.find();
      cards.forEach((card) => {
        if (card.order > deletedCard.order) {
          card.order -= 1;
        }
      });
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
    var correctColor = true;
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
            if (card.order < order) {
              if (otherCard.order >= card.order && otherCard.order <= order) {
                otherCard.order -= 1;
              }
            }
            if (card.order > order) {
              if (otherCard.order <= card.order && otherCard.order >= order) {
                otherCard.order += 1;
              }
            }
            await otherCard.save();
          }
        }
      }
      isHexColor(color) ? (correctColor = true) : (correctColor = false);
      var updatedCard: ICard | null;
      if (correctColor) {
        updatedCard = await Card.findByIdAndUpdate(
          card_id,
          { title, description, color, order },
          { new: true, runValidators: true }
        );
      } else {
        updatedCard = await Card.findByIdAndUpdate(
          card_id,
          { title, description, order },
          { new: true, runValidators: true }
        );
      }
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
      res
        .status(404)
        .json({ error: "You can only move cards within the same board" });
      return;
    }

    const board = await Board.findById(newColumn.boardID);
    const user = await User.findById(board?.userID);
    req.body.email = user?.email;
    next();
  },
  checkAccess,
  async (req: CustomRequest, res: Response) => {
    const { card_id, column_id } = req.body;
    const card = await Card.findById(card_id).catch(() => null);
    if (!card) return;
    const newColumnLenght = (await Card.find({ columnID: column_id })).length;

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
      const oldColumnCards = await Card.find({ columnID: card?.columnID });
      oldColumnCards.forEach(async (oldCard) => {
        if (oldCard.order > card?.order) {
          oldCard.order -= 1;
          await oldCard.save();
        }
      });
      updatedCard.order = newColumnLenght;
      await updatedCard.save();
      res.status(200).json(updatedCard);
    } catch (error) {
      console.error("Error moving card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Route to add a card
// Required in request headers: { Authorization: Bearer <token> }
// Required in request body: { column_id, title, description, color (optional), order (optional) }
cardRouter.post(
  "/",
  validateUserToken,
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { column_id, title, description, order } = req.body;
    if (!column_id || !title || !description === undefined) {
      res.status(400).json({
        error: "column_id, title, and description are required",
      });
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
    try {
      const { column_id, title, description, order, color } = req.body;
      let actualOrder = 0;
      if (order === undefined) {
        const cards = await Card.find({ columnID: column_id });
        cards ? (actualOrder = cards.length) : (actualOrder = 0);
      } else {
        actualOrder = order;
      }
      const card = new Card({
        columnID: column_id,
        title,
        description,
        order: actualOrder,
      });

      let colorWarning = null;
      if (color && isHexColor(color)) {
        card.color = color;
      } else if (color) {
        colorWarning = "Invalid color format. Card created without color.";
      }

      await card.save();
      const response: { card: ICard; warning?: string } = { card };
      if (colorWarning) {
        response.warning = colorWarning;
      }
      res.status(201).json(response);
    } catch (error) {
      console.error("Error adding card:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default cardRouter;
